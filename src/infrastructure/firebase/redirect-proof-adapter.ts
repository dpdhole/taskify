import { deleteApp, initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import {
  browserPopupRedirectResolver,
  browserSessionPersistence,
  connectAuthEmulator,
  getRedirectResult,
  initializeAuth,
  reauthenticateWithRedirect,
  signOut,
  updateCurrentUser,
} from 'firebase/auth';
import type { AuthProvider, User } from 'firebase/auth';
import { SessionError } from '../../application/session-controller';
import type {
  SessionReason,
  SignInProvider,
} from '../../application/session-controller';

export interface RedirectProofReturn {
  uid: string;
  epoch: string;
  createdAt: number;
  provider: SignInProvider;
  reason: SessionReason;
}
// A separate SDK-managed, session-persistent context confines automatic redirect
// startup to the same account's proof. It never replaces the primary Auth user.
export function createRedirectProofAdapter(
  app: FirebaseApp,
  emulator: { host: '127.0.0.1'; port: 9099 } | undefined,
  current: () => User | null,
  classify: (error: unknown) => SessionError,
) {
  const key = `taskify:proof-redirect:${app.options.projectId}:${app.name}`;
  const cleanupKey = key + ':cleanup';
  const epochKey = `taskify:logout:${app.options.projectId}`;
  let disposed = false;
  let sequence = 0;
  let active = false;
  let context: ReturnType<typeof createContext> | undefined;
  function epoch() {
    return window.localStorage.getItem(epochKey) ?? '';
  }
  function createContext() {
    window.sessionStorage.setItem(cleanupKey, '1');
    const proofApp = initializeApp(app.options, `taskify-proof:${app.name}`);
    const auth = initializeAuth(proofApp, {
      persistence: browserSessionPersistence,
      popupRedirectResolver: browserPopupRedirectResolver,
    });
    if (emulator)
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
        disableWarnings: true,
      });
    return { app: proofApp, auth };
  }
  async function clear() {
    const owned = context;
    context = undefined;
    if (!owned) return;
    try {
      await signOut(owned.auth);
      window.sessionStorage.removeItem(cleanupKey);
    } finally {
      await deleteApp(owned.app);
    }
  }
  function parse(
    raw: string,
  ): RedirectProofReturn & { nonce: string; createdAt: number; version: 1 } {
    const marker = JSON.parse(raw) as Record<string, unknown> | null;
    if (
      !marker ||
      marker.version !== 1 ||
      typeof marker.uid !== 'string' ||
      !marker.uid ||
      typeof marker.epoch !== 'string' ||
      typeof marker.nonce !== 'string' ||
      !marker.nonce ||
      (marker.provider !== 'google' && marker.provider !== 'microsoft') ||
      typeof marker.createdAt !== 'number' ||
      !Number.isFinite(marker.createdAt) ||
      marker.createdAt > Date.now() ||
      Date.now() - marker.createdAt > 900000
    )
      throw new SessionError('cancelled');
    return { ...marker, reason: 'none' } as RedirectProofReturn & {
      nonce: string;
      createdAt: number;
      version: 1;
    };
  }
  return {
    async resume(): Promise<RedirectProofReturn | undefined> {
      const raw = window.sessionStorage.getItem(key);
      if ((!raw && !window.sessionStorage.getItem(cleanupKey)) || disposed)
        return;
      const attempt = ++sequence;
      active = true;
      const user = current();
      let marker: ReturnType<typeof parse> | undefined;
      let outcome: RedirectProofReturn | undefined;
      try {
        if (raw) marker = parse(raw);
      } catch {
        /* Consume invalid intent. */
      }
      const valid = () =>
        !disposed &&
        attempt === sequence &&
        marker &&
        user &&
        current() === user &&
        user.uid === marker.uid &&
        epoch() === marker.epoch &&
        marker.createdAt <= Date.now() &&
        Date.now() - marker.createdAt <= 900000;
      try {
        context ??= createContext();
        const result = await getRedirectResult(context.auth);
        if (valid() && marker) {
          const reason = !result
            ? 'cancelled'
            : context.auth.currentUser?.uid !== marker.uid ||
                result.operationType !== 'reauthenticate' ||
                result.user.uid !== marker.uid ||
                result.providerId !==
                  (marker.provider === 'google'
                    ? 'google.com'
                    : 'microsoft.com')
              ? 'wrong-account'
              : 'none';
          outcome = {
            uid: marker.uid,
            epoch: marker.epoch,
            createdAt: marker.createdAt,
            provider: marker.provider,
            reason,
          };
        }
      } catch (error) {
        if (valid() && marker)
          outcome = {
            uid: marker.uid,
            epoch: marker.epoch,
            createdAt: marker.createdAt,
            provider: marker.provider,
            reason: classify(error).reason,
          };
      }
      window.sessionStorage.removeItem(key);
      try {
        await clear();
      } catch {
        outcome = undefined;
      }
      active = false;
      return valid() ? outcome : undefined;
    },
    async begin(
      user: User,
      providerId: SignInProvider,
      provider: AuthProvider,
    ): Promise<never> {
      if (disposed || current() !== user) throw new SessionError('cancelled');
      const attempt = ++sequence;
      active = true;
      const logoutEpoch = epoch();
      try {
        context ??= createContext();
        await updateCurrentUser(context.auth, user);
        if (
          disposed ||
          attempt !== sequence ||
          current() !== user ||
          epoch() !== logoutEpoch ||
          context.auth.currentUser === user ||
          context.auth.currentUser?.uid !== user.uid
        )
          throw new SessionError('cancelled');
        window.sessionStorage.setItem(
          key,
          JSON.stringify({
            version: 1,
            uid: user.uid,
            epoch: logoutEpoch,
            provider: providerId,
            nonce: crypto.randomUUID(),
            createdAt: Date.now(),
          }),
        );
        await reauthenticateWithRedirect(
          context.auth.currentUser,
          provider,
          browserPopupRedirectResolver,
        );
        throw new SessionError('cancelled');
      } catch (error) {
        window.sessionStorage.removeItem(key);
        await clear();
        throw classify(error);
      } finally {
        active = false;
      }
    },
    cancel() {
      sequence++;
      window.sessionStorage.removeItem(key);
    },
    dispose() {
      disposed = true;
      sequence++;
      window.sessionStorage.removeItem(key);
      // Do not race sign-out/deletion against SDK redirect storage writes.
      // The in-flight path cleans up on settlement; the sentinel covers reload.
      if (!active) void clear().catch(() => {});
    },
  };
}
