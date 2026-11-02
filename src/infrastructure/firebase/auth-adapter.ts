import { createProviderLinkAdapter } from './provider-link-adapter';
import type { LinkReturn } from '../../application/identity-ports';
import { readAuthMethods } from './auth-methods-reader';
import type { SignInProvider } from '../../application/session-controller';
import { createRedirectProofAdapter } from './redirect-proof-adapter';
import type { RedirectProofReturn } from './redirect-proof-adapter';
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  beforeAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  connectAuthEmulator,
  initializeAuth,
  onAuthStateChanged,
  setPersistence,
  reauthenticateWithPopup,
  signOut,
} from 'firebase/auth';
import type { SignInMethodsReader } from '../../application/identity-ports';
import type { FirebaseApp } from 'firebase/app';
import { SessionError } from '../../application/session-controller';
import type {
  AuthPort,
  SessionIdentity,
} from '../../application/session-controller';

export function createAuthAdapter(
  app: FirebaseApp,
  emulator?: { host: '127.0.0.1'; port: 9099 },
): AuthPort & SignInMethodsReader {
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
  let expectedProofUid: string | undefined;
  let proofSequence = 0;
  let signInLinkSuggestion: SignInProvider | undefined;
  let verifiedMethods:
    | { user: typeof auth.currentUser; providers: readonly SignInProvider[] }
    | undefined;
  let returnedProof: RedirectProofReturn | undefined;
  const redirectProof = createRedirectProofAdapter(
    app,
    emulator,
    () => auth.currentUser,
    providerError,
  );
  let returnedLink: LinkReturn | undefined;
  let returnedLinkUser: typeof auth.currentUser = null;
  let returnedLinkEpoch: string | null = null;
  const linkAdapter = createProviderLinkAdapter(
    app,
    emulator,
    () => auth.currentUser,
    providerFor,
    providerError,
  );
  function providerFor(providerId: 'google' | 'microsoft') {
    const provider =
      providerId === 'google'
        ? new GoogleAuthProvider()
        : new OAuthProvider('microsoft.com');
    provider.setCustomParameters(
      providerId === 'microsoft'
        ? { tenant: 'common', prompt: 'select_account' }
        : { prompt: 'select_account' },
    );
    return provider;
  }
  const epochKey = `taskify:logout:${app.options.projectId}`;
  const redirectKey = `taskify:provider-redirect:${app.options.projectId}`;
  // Consume an in-flight Google redirect started by the earlier deployed build.
  const legacyRedirectKey = `taskify:google-redirect:${app.options.projectId}`;
  function clearRedirectMarker() {
    window.sessionStorage.removeItem(redirectKey);
    window.sessionStorage.removeItem(legacyRedirectKey);
  }
  const stopGuard = beforeAuthStateChanged(auth, (user) => {
    if (
      user &&
      intent !== undefined &&
      (disposed ||
        (window.localStorage.getItem(epochKey) ?? '') !== intent ||
        (expectedProofUid !== undefined && user.uid !== expectedProofUid))
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
    if (
      ['auth/credential-already-in-use', 'auth/email-already-in-use'].includes(
        code,
      )
    )
      return new SessionError('link-conflict');
    if (code === 'auth/provider-already-linked')
      return new SessionError('already-linked');
    if (code === 'auth/user-mismatch') return new SessionError('wrong-account');
    if (
      [
        'auth/requires-recent-login',
        'auth/user-token-expired',
        'auth/invalid-credential',
      ].includes(code)
    )
      return new SessionError('proof-expired');
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
  let initialization: Promise<void> | undefined;
  async function initializeSession() {
    if (disposed) throw new SessionError('restoration');
    // Explicitly prove usable persistent storage; never silently promise memory-only persistence.
    try {
      const key = 'taskify:storage-probe:' + crypto.randomUUID();
      for (const storage of [window.localStorage, window.sessionStorage]) {
        try {
          storage.setItem(key, key);
          if (storage.getItem(key) !== key) throw Error('Storage unavailable');
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
      const currentMarker = window.sessionStorage.getItem(redirectKey);
      const marker =
        currentMarker ?? window.sessionStorage.getItem(legacyRedirectKey);
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
        const validProvider = currentMarker
          ? record.provider === 'google' || record.provider === 'microsoft'
          : true;
        const validSuggestion =
          record.linkSuggestion === undefined ||
          ((record.linkSuggestion === 'google' ||
            record.linkSuggestion === 'microsoft') &&
            record.linkSuggestion !== record.provider);
        const valid =
          validSuggestion &&
          record.operation === undefined &&
          validProvider &&
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
          if (
            valid &&
            (record.linkSuggestion === 'google' ||
              record.linkSuggestion === 'microsoft')
          )
            signInLinkSuggestion = record.linkSuggestion;
          if (invalid) throw new SessionError('cancelled');
        } catch (error) {
          const classified = providerError(error);
          if (valid && classified.reason === 'account-conflict')
            signInLinkSuggestion =
              currentMarker && record.provider === 'microsoft'
                ? 'microsoft'
                : 'google';
          throw classified;
        } finally {
          clearRedirectMarker();
          intent = undefined;
          expectedProofUid = undefined;
          pending = false;
          if (disposed) stopGuard();
        }
      }
      await auth.authStateReady();
      returnedProof = await redirectProof.resume();
      returnedLink = await linkAdapter.resume();
      returnedLinkUser = auth.currentUser;
      returnedLinkEpoch = window.localStorage.getItem(epochKey);
      if (disposed) throw new SessionError('cancelled');
      ready = true;
    } catch (error) {
      clearRedirectMarker();
      intent = undefined;
      expectedProofUid = undefined;
      throw error instanceof SessionError
        ? error
        : new SessionError('restoration');
    }
  }
  return {
    initialize() {
      initialization ??= initializeSession().finally(() => {
        initialization = undefined;
      });
      return initialization;
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
    hasVerificationReturn() {
      return Boolean(
        ready &&
        !disposed &&
        returnedProof &&
        auth.currentUser?.uid === returnedProof.uid &&
        returnedProof.epoch === (window.localStorage.getItem(epochKey) ?? '') &&
        Date.now() - returnedProof.createdAt <= 900000 &&
        returnedProof.createdAt <= Date.now(),
      );
    },
    async readSignInMethods(uid) {
      const user = auth.currentUser;
      if (disposed || !ready || pending || !user || user.uid !== uid)
        throw new SessionError('restoration');
      const epoch = window.localStorage.getItem(epochKey);
      try {
        const snapshot = await readAuthMethods(app, user, emulator);
        if (
          disposed ||
          auth.currentUser !== user ||
          user.uid !== uid ||
          window.localStorage.getItem(epochKey) !== epoch
        )
          throw new SessionError('cancelled');
        if (snapshot.uid !== uid) throw new SessionError('restoration');
        verifiedMethods = { user, providers: snapshot.providers };
        const proof = returnedProof;
        returnedProof = undefined;
        return {
          uid,
          ...(proof &&
          proof.uid === uid &&
          proof.epoch === (window.localStorage.getItem(epochKey) ?? '') &&
          Date.now() - proof.createdAt <= 900000 &&
          proof.createdAt <= Date.now()
            ? {
                verificationReturn: {
                  provider: proof.provider,
                  reason: proof.reason,
                },
              }
            : {}),
          providers: snapshot.providers,
        };
      } catch (error) {
        throw providerError(error);
      }
    },
    takeLinkReturn() {
      const result = returnedLink;
      const bound =
        auth.currentUser === returnedLinkUser &&
        window.localStorage.getItem(epochKey) === returnedLinkEpoch;
      returnedLink = undefined;
      returnedLinkUser = null;
      returnedLinkEpoch = null;
      return ready &&
        !disposed &&
        bound &&
        result &&
        auth.currentUser?.uid === result.uid
        ? result
        : undefined;
    },
    async proveLink(uid, target, existing, transport) {
      if (disposed || !ready || pending || auth.currentUser?.uid !== uid)
        throw new SessionError('cancelled');
      pending = true;
      try {
        return await linkAdapter.prove(uid, target, existing, transport);
      } finally {
        pending = false;
        if (disposed) stopGuard();
      }
    },
    async submitLink(uid, target, proofId, transport) {
      if (disposed || !ready || pending || auth.currentUser?.uid !== uid)
        throw new SessionError('cancelled');
      pending = true;
      try {
        return await linkAdapter.submit(uid, target, proofId, transport);
      } catch (error) {
        const classified = providerError(error);
        throw classified.reason === 'account-conflict'
          ? new SessionError('link-conflict')
          : classified;
      } finally {
        pending = false;
        if (disposed) stopGuard();
      }
    },
    cancelLink() {
      returnedLink = undefined;
      linkAdapter.cancel();
    },
    async reauthenticate(uid, providerId, transport) {
      const user = auth.currentUser;
      if (
        disposed ||
        !ready ||
        pending ||
        !user ||
        user.uid !== uid ||
        !(verifiedMethods?.user === user
          ? verifiedMethods.providers.includes(providerId)
          : user.providerData.some(
              (p) =>
                p.providerId ===
                (providerId === 'google' ? 'google.com' : 'microsoft.com'),
            ))
      )
        throw new SessionError('wrong-account');
      returnedProof = undefined;
      const attempt = ++proofSequence;
      const epoch = window.localStorage.getItem(epochKey) ?? '';
      expectedProofUid = uid;
      intent = epoch;
      pending = true;
      try {
        const provider = providerFor(providerId);
        if (transport === 'redirect')
          return await redirectProof.begin(user, providerId, provider);
        const result = await reauthenticateWithPopup(
          user,
          provider,
          browserPopupRedirectResolver,
        );
        if (
          disposed ||
          attempt !== proofSequence ||
          auth.currentUser !== user ||
          (window.localStorage.getItem(epochKey) ?? '') !== epoch
        )
          throw new SessionError('cancelled');
        if (
          result.user.uid !== uid ||
          result.operationType !== 'reauthenticate'
        )
          throw new SessionError('wrong-account');
        return { uid };
      } catch (error) {
        clearRedirectMarker();
        throw providerError(error);
      } finally {
        intent = undefined;
        expectedProofUid = undefined;
        pending = false;
        if (disposed) stopGuard();
      }
    },
    cancelReauthentication() {
      proofSequence++;
      returnedProof = undefined;
      redirectProof.cancel();
    },
    getLinkSuggestion() {
      const id = signInLinkSuggestion;
      return id &&
        !auth.currentUser?.providerData.some(
          (p) =>
            p.providerId === (id === 'google' ? 'google.com' : 'microsoft.com'),
        )
        ? id
        : undefined;
    },
    clearLinkSuggestion() {
      signInLinkSuggestion = undefined;
    },
    async signIn(providerId, transport) {
      if (disposed || !ready || pending)
        throw new SessionError('provider-unavailable');
      pending = true;
      try {
        intent = window.localStorage.getItem(epochKey) ?? '';
        const provider = providerFor(providerId);
        if (transport === 'redirect') {
          window.sessionStorage.setItem(
            redirectKey,
            JSON.stringify({
              provider: providerId,
              ...(signInLinkSuggestion && signInLinkSuggestion !== providerId
                ? { linkSuggestion: signInLinkSuggestion }
                : {}),
              epoch: intent,
              createdAt: Date.now(),
            }),
          );
          await signInWithRedirect(
            auth,
            provider,
            browserPopupRedirectResolver,
          );
        } else
          await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      } catch (error) {
        clearRedirectMarker();
        const classified = providerError(error);
        if (classified.reason === 'account-conflict')
          signInLinkSuggestion = providerId;
        throw classified;
      } finally {
        pending = false;
        intent = undefined;
        if (disposed) stopGuard();
      }
    },
    async signOut() {
      if (disposed) throw new SessionError('logout');
      try {
        proofSequence++;
        signInLinkSuggestion = undefined;
        returnedProof = undefined;
        redirectProof.cancel();
        returnedLink = undefined;
        linkAdapter.cancel();
        window.localStorage.setItem(epochKey, crypto.randomUUID());
        clearRedirectMarker();
        await signOut(auth);
      } catch {
        throw new SessionError('logout');
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      proofSequence++;
      returnedProof = undefined;
      redirectProof.dispose();
      returnedLink = undefined;
      linkAdapter.dispose();
      if (!pending) stopGuard();
      for (const stop of stops) stop();
      stops.clear();
    },
  };
}
