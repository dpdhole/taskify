import { initializeApp, deleteApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  browserSessionPersistence,
  browserPopupRedirectResolver,
  connectAuthEmulator,
  updateCurrentUser,
  reauthenticateWithPopup,
  reauthenticateWithRedirect,
  getRedirectResult,
  getIdTokenResult,
  GoogleAuthProvider,
  OAuthProvider,
  beforeAuthStateChanged,
  signOut,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { readAuthMethods } from './auth-methods-reader';
import {
  deletionId,
  deletionProofIsRecent,
} from '../../domain/account-deletion';
import type { DeletionProvider } from '../../domain/account-deletion';
import { DeletionError } from '../../application/account-deletion-port';
import type { DeletionProofPort } from '../../application/account-deletion-port';
interface Intent {
  version: 1;
  uid: string;
  jobId: string;
  nonce: string;
  provider: DeletionProvider;
  epoch: string;
  createdAt: number;
  confirmed: true;
}
export function createDeletionProofAdapter(
  app: FirebaseApp,
  emulator?: { host: '127.0.0.1'; port: 9099 },
): DeletionProofPort {
  const primary = getAuth(app),
    key = `taskify:deletion-proof:${app.options.projectId}:${app.name}`;
  const epochKey = `taskify:logout:${app.options.projectId}`;
  let disposed = false,
    sequence = 0,
    active = false;
  let context: ReturnType<typeof createContext> | undefined;
  let transferring: Intent | undefined;
  const epoch = () => window.localStorage.getItem(epochKey) ?? '';
  const bound = (i: Intent) =>
    !disposed && primary.currentUser?.uid === i.uid && epoch() === i.epoch;
  const guard = beforeAuthStateChanged(primary, (user) => {
    if (
      user &&
      transferring &&
      (!bound(transferring) || user.uid !== transferring.uid)
    )
      throw new DeletionError('cancelled');
  });
  function createContext() {
    const owned = initializeApp(app.options, `taskify-deletion:${app.name}`);
    const auth = initializeAuth(owned, {
      persistence: browserSessionPersistence,
      popupRedirectResolver: browserPopupRedirectResolver,
    });
    if (emulator)
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
        disableWarnings: true,
      });
    return { app: owned, auth };
  }
  async function clear() {
    const owned = context;
    context = undefined;
    if (owned) {
      try {
        await signOut(owned.auth);
      } finally {
        await deleteApp(owned.app);
      }
    }
  }
  function parse(raw: string): Intent {
    const i = JSON.parse(raw) as Intent;
    if (
      i?.version !== 1 ||
      i.confirmed !== true ||
      typeof i.uid !== 'string' ||
      !i.uid ||
      typeof i.epoch !== 'string' ||
      (i.provider !== 'google.com' && i.provider !== 'microsoft.com') ||
      !Number.isFinite(i.createdAt) ||
      i.createdAt > Date.now() ||
      Date.now() - i.createdAt > 900000
    )
      throw new DeletionError('proof-invalid');
    deletionId(i.jobId);
    deletionId(i.nonce);
    return i;
  }
  async function transfer(i: Intent, original: User, attempt: number) {
    const valid = () => attempt === sequence && bound(i);
    if (
      !valid() ||
      primary.currentUser !== original ||
      context?.auth.currentUser?.uid !== i.uid
    )
      throw new DeletionError('cancelled');
    transferring = i;
    try {
      await updateCurrentUser(primary, context.auth.currentUser);
    } finally {
      transferring = undefined;
    }
    const proven = primary.currentUser;
    if (!valid() || !proven) throw new DeletionError('cancelled');
    const token = await getIdTokenResult(proven, true);
    const authTime = token.claims.auth_time;
    if (
      !valid() ||
      primary.currentUser !== proven ||
      typeof authTime !== 'number' ||
      token.signInProvider !== i.provider ||
      !deletionProofIsRecent(authTime, {
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0,
      })
    )
      throw new DeletionError('proof-invalid');
    return { uid: i.uid, jobId: i.jobId, provider: i.provider, authTime };
  }
  function classify(error: unknown): DeletionError {
    if (error instanceof DeletionError) return error;
    return new DeletionError(
      error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'auth/popup-blocked'
        ? 'popup-blocked'
        : 'proof-invalid',
    );
  }
  return {
    async providers(uid) {
      const user = primary.currentUser,
        savedEpoch = epoch();
      if (!user || user.uid !== uid || disposed || active)
        throw new DeletionError('cancelled');
      const result = await readAuthMethods(app, user, emulator);
      if (
        disposed ||
        primary.currentUser !== user ||
        epoch() !== savedEpoch ||
        result.uid !== uid
      )
        throw new DeletionError('cancelled');
      return result.providers.map((p) =>
        p === 'google' ? 'google.com' : 'microsoft.com',
      );
    },
    async prove(uid, jobId, provider, transport) {
      if (active || disposed || primary.currentUser?.uid !== uid)
        throw new DeletionError('cancelled');
      deletionId(jobId);
      if (!(await this.providers(uid)).includes(provider))
        throw new DeletionError('proof-invalid');
      if (active || disposed || primary.currentUser?.uid !== uid)
        throw new DeletionError('cancelled');
      active = true;
      const attempt = ++sequence,
        original = primary.currentUser!;
      let redirecting = false;
      const i: Intent = {
        version: 1,
        uid,
        jobId,
        provider,
        nonce: crypto.randomUUID(),
        epoch: epoch(),
        createdAt: Date.now(),
        confirmed: true,
      };
      try {
        context = createContext();
        await updateCurrentUser(context.auth, original);
        if (
          !bound(i) ||
          attempt !== sequence ||
          context.auth.currentUser?.uid !== uid ||
          primary.currentUser !== original
        )
          throw new DeletionError('cancelled');
        const p =
          provider === 'google.com'
            ? new GoogleAuthProvider()
            : new OAuthProvider('microsoft.com');
        p.setCustomParameters(
          provider === 'google.com'
            ? { prompt: 'select_account' }
            : { tenant: 'common', prompt: 'select_account' },
        );
        if (transport === 'redirect') {
          window.sessionStorage.setItem(key, JSON.stringify(i));
          redirecting = true;
          try {
            await reauthenticateWithRedirect(
              context.auth.currentUser,
              p,
              browserPopupRedirectResolver,
            );
          } catch (error) {
            redirecting = false;
            throw error;
          }
          throw new DeletionError('cancelled');
        }
        const result = await reauthenticateWithPopup(
          context.auth.currentUser,
          p,
          browserPopupRedirectResolver,
        );
        if (
          result.operationType !== 'reauthenticate' ||
          result.user.uid !== uid ||
          result.providerId !== provider
        )
          throw new DeletionError('proof-invalid');
        return await transfer(i, original, attempt);
      } catch (error) {
        if (!redirecting) window.sessionStorage.removeItem(key);
        throw classify(error);
      } finally {
        active = false;
        if (!redirecting) await clear();
      }
    },
    async resume(uid) {
      const raw = window.sessionStorage.getItem(key);
      if (!raw || disposed || active) return;
      active = true;
      const attempt = ++sequence;
      try {
        const i = parse(raw),
          original = primary.currentUser;
        if (!original || uid !== i.uid || !bound(i))
          throw new DeletionError('cancelled');
        context = createContext();
        await context.auth.authStateReady();
        const result = await getRedirectResult(context.auth);
        if (
          !result ||
          result.operationType !== 'reauthenticate' ||
          result.user.uid !== uid ||
          result.providerId !== i.provider
        )
          throw new DeletionError('proof-invalid');
        return await transfer(i, original, attempt);
      } catch (error) {
        throw classify(error);
      } finally {
        window.sessionStorage.removeItem(key);
        active = false;
        await clear();
      }
    },
    cancel() {
      sequence++;
      window.sessionStorage.removeItem(key);
      if (!active) void clear().catch(() => {});
    },
    dispose() {
      disposed = true;
      sequence++;
      guard();
      if (!active && !window.sessionStorage.getItem(key))
        void clear().catch(() => {});
    },
  };
}
