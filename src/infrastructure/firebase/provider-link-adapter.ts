import { initializeApp, deleteApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  browserSessionPersistence,
  browserPopupRedirectResolver,
  connectAuthEmulator,
  updateCurrentUser,
  reauthenticateWithPopup,
  reauthenticateWithRedirect,
  linkWithPopup,
  linkWithRedirect,
  getRedirectResult,
  signOut,
} from 'firebase/auth';
import type { User, AuthProvider } from 'firebase/auth';
import { SessionError } from '../../application/session-controller';
import type {
  SignInProvider,
  SignInTransport,
} from '../../application/session-controller';
import type { LinkReturn } from '../../application/identity-ports';
type Intent = {
  version: 1;
  uid: string;
  epoch: string;
  nonce: string;
  createdAt: number;
  target: SignInProvider;
  existing: SignInProvider;
  stage: 'proof' | 'link';
};
const validProvider = (p: unknown): p is SignInProvider =>
  p === 'google' || p === 'microsoft';
export function createProviderLinkAdapter(
  app: FirebaseApp,
  emulator: { host: '127.0.0.1'; port: 9099 } | undefined,
  current: () => User | null,
  provider: (p: SignInProvider) => AuthProvider,
  classify: (e: unknown) => SessionError,
) {
  const key = `taskify:link-redirect:${app.options.projectId}:${app.name}`;
  const cleanupKey = key + ':cleanup';
  const epochKey = `taskify:logout:${app.options.projectId}`;
  let context: ReturnType<typeof createContext> | undefined;
  let proof: { intent: Intent; primary: User } | undefined;
  let active = false,
    disposed = false,
    sequence = 0;
  const epoch = () => window.localStorage.getItem(epochKey) ?? '';
  const fresh = (i: Intent) =>
    i.createdAt <= Date.now() && Date.now() - i.createdAt <= 300000;
  function createContext(nonce: string) {
    window.sessionStorage.setItem(cleanupKey, nonce);
    const owned = initializeApp(
      app.options,
      `taskify-link:${app.name}:${nonce}`,
    );
    const auth = initializeAuth(owned, {
      persistence: browserSessionPersistence,
      popupRedirectResolver: browserPopupRedirectResolver,
    });
    if (emulator)
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
        disableWarnings: true,
      });
    return { app: owned, auth, nonce };
  }
  let clearing: Promise<void> | undefined;
  function clear(): Promise<void> {
    proof = undefined;
    if (clearing) return clearing;
    const owned = context;
    context = undefined;
    if (!owned) return Promise.resolve();
    clearing = (async () => {
      try {
        await signOut(owned.auth);
        if (window.sessionStorage.getItem(cleanupKey) === owned.nonce)
          window.sessionStorage.removeItem(cleanupKey);
      } finally {
        await deleteApp(owned.app);
      }
    })().finally(() => {
      clearing = undefined;
    });
    return clearing;
  }
  function parse(raw: string): Intent | undefined {
    try {
      const x = JSON.parse(raw) as Intent;
      if (
        x?.version === 1 &&
        typeof x.uid === 'string' &&
        x.uid &&
        typeof x.epoch === 'string' &&
        typeof x.nonce === 'string' &&
        x.nonce &&
        typeof x.createdAt === 'number' &&
        Number.isFinite(x.createdAt) &&
        validProvider(x.target) &&
        validProvider(x.existing) &&
        x.target !== x.existing &&
        (x.stage === 'proof' || x.stage === 'link')
      )
        return x;
    } catch {
      /* Invalid intent never grants authority. */
    }
    return;
  }
  function bound(i: Intent, user: User | null) {
    return (
      !disposed &&
      user !== null &&
      current() === user &&
      user.uid === i.uid &&
      epoch() === i.epoch
    );
  }
  return {
    async prove(
      uid: string,
      target: SignInProvider,
      existing: SignInProvider,
      transport: SignInTransport,
    ) {
      if (!validProvider(target) || !validProvider(existing))
        throw new SessionError('configuration');
      const user = current();
      if (
        disposed ||
        active ||
        !user ||
        user.uid !== uid ||
        target === existing
      )
        throw new SessionError('cancelled');
      const attempt = ++sequence;
      active = true;
      const intent: Intent = {
        version: 1,
        uid,
        epoch: epoch(),
        nonce: crypto.randomUUID(),
        createdAt: Date.now(),
        target,
        existing,
        stage: 'proof',
      };
      try {
        await clear();
        const leftover = window.sessionStorage.getItem(cleanupKey);
        if (leftover) {
          context = createContext(leftover);
          await clear();
        }
        context = createContext(intent.nonce);
        await updateCurrentUser(context.auth, user);
        if (
          attempt !== sequence ||
          !bound(intent, user) ||
          context.auth.currentUser === user ||
          context.auth.currentUser?.uid !== uid
        )
          throw new SessionError('cancelled');
        if (transport === 'redirect') {
          window.sessionStorage.setItem(key, JSON.stringify(intent));
          await reauthenticateWithRedirect(
            context.auth.currentUser,
            provider(existing),
            browserPopupRedirectResolver,
          );
          throw new SessionError('cancelled');
        }
        const result = await reauthenticateWithPopup(
          context.auth.currentUser,
          provider(existing),
          browserPopupRedirectResolver,
        );
        if (attempt !== sequence || !bound(intent, user) || !fresh(intent))
          throw new SessionError('cancelled');
        if (!fresh(intent)) throw new SessionError('proof-expired');
        if (
          result.user.uid !== uid ||
          context.auth.currentUser?.uid !== uid ||
          result.providerId !==
            (existing === 'google' ? 'google.com' : 'microsoft.com') ||
          result.operationType !== 'reauthenticate'
        )
          throw new SessionError('wrong-account');
        proof = { intent, primary: user };
        return { uid, proofId: intent.nonce };
      } catch (error) {
        window.sessionStorage.removeItem(key);
        await clear();
        throw classify(error);
      } finally {
        active = false;
      }
    },
    async submit(
      uid: string,
      target: SignInProvider,
      proofId: string,
      transport: SignInTransport,
    ) {
      const granted = proof;
      if (
        disposed ||
        active ||
        !granted ||
        granted.intent.nonce !== proofId ||
        granted.intent.uid !== uid ||
        granted.intent.target !== target ||
        !fresh(granted.intent) ||
        !bound(granted.intent, granted.primary) ||
        !context?.auth.currentUser ||
        context.auth.currentUser.uid !== uid
      )
        throw new SessionError('proof-expired');
      const intent: Intent = { ...granted.intent, stage: 'link' };
      proof = undefined;
      active = true; // One use; SDK invocation is mutation in flight.
      const attempt = ++sequence;
      try {
        if (transport === 'redirect') {
          window.sessionStorage.setItem(key, JSON.stringify(intent));
          await linkWithRedirect(
            context.auth.currentUser,
            provider(target),
            browserPopupRedirectResolver,
          );
          throw new SessionError('link-uncertain');
        }
        const result = await linkWithPopup(
          context.auth.currentUser,
          provider(target),
          browserPopupRedirectResolver,
        );
        if (
          attempt !== sequence ||
          !bound(intent, granted.primary) ||
          result.user.uid !== uid ||
          result.providerId !==
            (target === 'google' ? 'google.com' : 'microsoft.com') ||
          result.operationType !== 'link'
        )
          throw new SessionError('link-uncertain');
        return { uid };
      } catch (error) {
        throw classify(error);
      } finally {
        window.sessionStorage.removeItem(key);
        try {
          await clear();
        } finally {
          active = false;
        }
      }
    },
    async resume(): Promise<LinkReturn | undefined> {
      const raw = window.sessionStorage.getItem(key);
      if (disposed || (!raw && !window.sessionStorage.getItem(cleanupKey)))
        return;
      const cleanupNonce = window.sessionStorage.getItem(cleanupKey);
      const parsed = raw ? parse(raw) : undefined;
      const intent = parsed?.nonce === cleanupNonce ? parsed : undefined;
      const user = current();
      const attempt = ++sequence;
      active = true;
      let retained = false;
      let result: LinkReturn | undefined;
      try {
        if (!cleanupNonce) return;
        context = createContext(cleanupNonce);
        let returned;
        try {
          returned = await getRedirectResult(context.auth);
        } catch (error) {
          if (intent && bound(intent, user) && attempt === sequence)
            result = {
              uid: intent.uid,
              target: intent.target,
              existing: intent.existing,
              stage: intent.stage === 'link' ? 'checking' : 'error',
              reason: classify(error).reason,
            };
        }
        if (intent && bound(intent, user) && attempt === sequence) {
          if (intent.stage === 'link')
            result = {
              uid: intent.uid,
              target: intent.target,
              existing: intent.existing,
              stage: 'checking',
              reason: result?.reason ?? 'link-uncertain',
            };
          else if (
            fresh(intent) &&
            returned?.operationType === 'reauthenticate' &&
            returned.user.uid === intent.uid &&
            context.auth.currentUser?.uid === intent.uid &&
            returned.providerId ===
              (intent.existing === 'google' ? 'google.com' : 'microsoft.com')
          ) {
            proof = { intent, primary: user! };
            retained = true;
            result = {
              uid: intent.uid,
              target: intent.target,
              existing: intent.existing,
              stage: 'ready',
              proofId: intent.nonce,
              reason: 'none',
            };
          } else
            result ??= {
              uid: intent.uid,
              target: intent.target,
              existing: intent.existing,
              stage: 'error',
              reason: fresh(intent) ? 'cancelled' : 'proof-expired',
            };
        }
      } finally {
        window.sessionStorage.removeItem(key);
        if (!retained)
          try {
            await clear();
          } catch {
            if (result)
              result = { ...result, stage: 'error', reason: 'link-uncertain' };
          }
        active = false;
      }
      if (!intent || !bound(intent, user) || attempt !== sequence) return;
      return result;
    },
    cancel() {
      sequence++;
      proof = undefined;
      // A submitted redirect may still mutate the original UID. Preserve only
      // the correlation needed to check its outcome; never promise rollback.
      const raw = window.sessionStorage.getItem(key);
      if (!raw || parse(raw)?.stage !== 'link')
        window.sessionStorage.removeItem(key);
      if (!active) void clear().catch(() => {});
    },
    dispose() {
      disposed = true;
      sequence++;
      proof = undefined;
      if (!active) void clear().catch(() => {});
    },
  };
}
