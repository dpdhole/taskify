import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  beforeAuthStateChanged,
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  connectAuthEmulator,
  initializeAuth,
  onAuthStateChanged,
  setPersistence,
  signOut,
} from 'firebase/auth';
import type { FirebaseApp } from 'firebase/app';
import { SessionError } from '../../application/session-controller';
import type {
  AuthPort,
  SessionIdentity,
} from '../../application/session-controller';

export function createAuthAdapter(
  app: FirebaseApp,
  emulator?: { host: '127.0.0.1'; port: 9099 },
): AuthPort {
  if (
    (app.options.projectId?.startsWith('demo-') ?? false) !==
      Boolean(emulator) ||
    (emulator && (emulator.host !== '127.0.0.1' || emulator.port !== 9099))
  )
    throw new SessionError('configuration');
  if (!emulator && app.options.projectId !== 'taskify-dev-dpdhole')
    throw new SessionError('configuration');
  const auth = initializeAuth(app, { persistence: browserLocalPersistence });
  if (emulator)
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
      disableWarnings: true,
    });
  const stops = new Set<() => void>();
  let disposed = false;
  let ready = false;
  let pending = false;
  let intent: string | undefined;
  const epochKey = `taskify:logout:${app.options.projectId}`;
  const redirectKey = `taskify:google-redirect:${app.options.projectId}`;
  const stopGuard = beforeAuthStateChanged(auth, (user) => {
    if (
      user &&
      intent !== undefined &&
      (disposed || (window.localStorage.getItem(epochKey) ?? '') !== intent)
    )
      throw new SessionError('cancelled');
  });
  function providerError(error: unknown): SessionError {
    if (error instanceof SessionError) return error;
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : '';
    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      code === 'auth/login-blocked'
    )
      return new SessionError('cancelled');
    if (code === 'auth/popup-blocked') return new SessionError('popup-blocked');
    if (code === 'auth/account-exists-with-different-credential')
      return new SessionError('account-conflict');
    if (code === 'auth/network-request-failed')
      return new SessionError('network');
    if (
      [
        'auth/unauthorized-domain',
        'auth/operation-not-allowed',
        'auth/invalid-api-key',
        'auth/invalid-oauth-client-id',
      ].includes(code)
    )
      return new SessionError('provider-configuration');
    return new SessionError('provider-unavailable');
  }
  return {
    async initialize() {
      if (disposed) throw new SessionError('restoration');
      // Explicitly prove usable persistent storage; never silently promise memory-only persistence.
      try {
        const key = 'taskify:storage-probe:' + crypto.randomUUID();
        for (const storage of [window.localStorage, window.sessionStorage]) {
          try {
            storage.setItem(key, key);
            if (storage.getItem(key) !== key)
              throw Error('Storage unavailable');
          } finally {
            storage.removeItem(key);
          }
        }
        await setPersistence(auth, browserLocalPersistence);
      } catch {
        throw new SessionError('persistence');
      }
      try {
        if (disposed) throw new SessionError('restoration');
        // Only process redirect results when this origin initiated a redirect.
        const marker = window.sessionStorage.getItem(redirectKey);
        if (marker) {
          let saved: unknown;
          try {
            saved = JSON.parse(marker);
          } catch {
            saved = null;
          }
          const record =
            typeof saved === 'object' && saved !== null
              ? (saved as Record<string, unknown>)
              : {};
          const valid =
            typeof record.epoch === 'string' &&
            typeof record.createdAt === 'number' &&
            Number.isFinite(record.createdAt) &&
            Date.now() - record.createdAt <= 900000 &&
            record.createdAt <= Date.now() &&
            (window.localStorage.getItem(epochKey) ?? '') === record.epoch;
          intent = valid ? (record.epoch as string) : crypto.randomUUID();
          const invalid = !valid;
          pending = true;
          try {
            await getRedirectResult(auth, browserPopupRedirectResolver);
            if (invalid) throw new SessionError('cancelled');
          } catch (error) {
            throw providerError(error);
          } finally {
            window.sessionStorage.removeItem(redirectKey);
            intent = undefined;
            pending = false;
            if (disposed) stopGuard();
          }
        }
        await auth.authStateReady();
        ready = true;
      } catch (error) {
        window.sessionStorage.removeItem(redirectKey);
        intent = undefined;
        throw error instanceof SessionError
          ? error
          : new SessionError('restoration');
      }
    },
    observe(next, error) {
      if (disposed) throw new SessionError('restoration');
      const stop = onAuthStateChanged(
        auth,
        (user) => {
          if (disposed) return;
          const identity: SessionIdentity | null = user
            ? {
                uid: user.uid,
                ...(user.displayName ? { displayName: user.displayName } : {}),
                ...(user.email ? { email: user.email } : {}),
              }
            : null;
          next(identity);
        },
        () => {
          if (!disposed) error();
        },
      );
      const dispose = () => {
        stop();
        stops.delete(dispose);
      };
      stops.add(dispose);
      return dispose;
    },
    async signInGoogle(transport) {
      if (disposed || !ready || pending)
        throw new SessionError('provider-unavailable');
      pending = true;
      try {
        intent = window.localStorage.getItem(epochKey) ?? '';
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        if (transport === 'redirect') {
          window.sessionStorage.setItem(
            redirectKey,
            JSON.stringify({ epoch: intent, createdAt: Date.now() }),
          );
          await signInWithRedirect(
            auth,
            provider,
            browserPopupRedirectResolver,
          );
        } else
          await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      } catch (error) {
        window.sessionStorage.removeItem(redirectKey);
        throw providerError(error);
      } finally {
        pending = false;
        intent = undefined;
        if (disposed) stopGuard();
      }
    },
    async signOut() {
      if (disposed) throw new SessionError('logout');
      try {
        window.localStorage.setItem(epochKey, crypto.randomUUID());
        window.sessionStorage.removeItem(redirectKey);
        await signOut(auth);
      } catch {
        throw new SessionError('logout');
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (!pending) stopGuard();
      for (const stop of stops) stop();
      stops.clear();
    },
  };
}
