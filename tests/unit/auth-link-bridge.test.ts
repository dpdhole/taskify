import { beforeEach, afterEach, it, vi, expect } from 'vitest';
import type { FirebaseApp } from 'firebase/app';
const sdk = vi.hoisted(() => ({
  initializeAuth: vi.fn(),
  beforeAuthStateChanged: vi.fn(),
  setPersistence: vi.fn(),
  browserLocalPersistence: {},
  browserPopupRedirectResolver: {},
  signOut: vi.fn(),
  connectAuthEmulator: vi.fn(),
  onAuthStateChanged: vi.fn(),
  getRedirectResult: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  reauthenticateWithPopup: vi.fn(),
  GoogleAuthProvider: class {
    setCustomParameters() {}
  },
  OAuthProvider: class {
    setCustomParameters() {}
  },
}));
const link = vi.hoisted(() => ({
  prove: vi.fn(),
  submit: vi.fn(),
  resume: vi.fn(),
  cancel: vi.fn(),
  dispose: vi.fn(),
}));
vi.mock('firebase/auth', () => sdk);
vi.mock('../../src/infrastructure/firebase/provider-link-adapter', () => ({
  createProviderLinkAdapter: () => link,
}));
vi.mock('../../src/infrastructure/firebase/redirect-proof-adapter', () => ({
  createRedirectProofAdapter: () => ({
    resume: async () => undefined,
    cancel() {},
    dispose() {},
  }),
}));
vi.mock('../../src/infrastructure/firebase/auth-methods-reader', () => ({
  readAuthMethods: vi.fn(),
}));
import { createAuthAdapter } from '../../src/infrastructure/firebase/auth-adapter';
let auth: {
  currentUser: { uid: string; providerData: { providerId: string }[] };
  authStateReady: () => Promise<void>;
};
const app = {
  name: 'primary',
  options: { projectId: 'taskify-dev-dpdhole' },
} as FirebaseApp;
beforeEach(() => {
  vi.resetAllMocks();
  const entries = new Map<string, string>();
  const store = {
    getItem: (k: string) => entries.get(k) ?? null,
    setItem: (k: string, v: string) => {
      entries.set(k, v);
    },
    removeItem: (k: string) => {
      entries.delete(k);
    },
  };
  vi.stubGlobal('window', { localStorage: store, sessionStorage: store });
  auth = {
    currentUser: { uid: 'owner', providerData: [{ providerId: 'google.com' }] },
    authStateReady: async () => {},
  };
  sdk.initializeAuth.mockReturnValue(auth);
  sdk.beforeAuthStateChanged.mockReturnValue(vi.fn());
  sdk.setPersistence.mockResolvedValue(undefined);
  sdk.signOut.mockResolvedValue(undefined);
  link.resume.mockResolvedValue(undefined);
});
afterEach(() => vi.unstubAllGlobals());
it('serializes primary provider operations against an in-flight linking proof', async () => {
  const adapter = createAuthAdapter(app);
  await adapter.initialize();
  let finish!: (v: unknown) => void;
  link.prove.mockImplementation(
    () =>
      new Promise((r) => {
        finish = r;
      }),
  );
  const p = adapter.proveLink!('owner', 'microsoft', 'google', 'popup');
  await expect(adapter.signIn!('google', 'popup')).rejects.toMatchObject({
    reason: 'provider-unavailable',
  });
  await expect(
    adapter.submitLink!('owner', 'microsoft', 'proof', 'popup'),
  ).rejects.toMatchObject({ reason: 'cancelled' });
  expect(link.submit).not.toHaveBeenCalled();
  finish({ uid: 'owner', proofId: 'opaque' });
  await expect(p).resolves.toEqual({ uid: 'owner', proofId: 'opaque' });
  adapter.dispose();
});
it.each([
  'auth/credential-already-in-use',
  'auth/email-already-in-use',
  'auth/account-exists-with-different-credential',
])('projects %s as a link conflict without raw response data', async (code) => {
  const adapter = createAuthAdapter(app);
  await adapter.initialize();
  link.submit.mockRejectedValue({
    code,
    message: 'not-for-ui',
    credential: { private: 'not-for-ui' },
  });
  await expect(
    adapter.submitLink!('owner', 'microsoft', 'proof', 'popup'),
  ).rejects.toMatchObject({
    reason: 'link-conflict',
    message: 'link-conflict',
  });
  expect(auth.currentUser.uid).toBe('owner');
  expect(sdk.signOut).not.toHaveBeenCalled();
  adapter.dispose();
});
it.each(['none', 'epoch', 'user'] as const)(
  'consumes redirect continuation once and rejects changed session binding: %s',
  async (change) => {
    link.resume.mockResolvedValue({
      uid: 'owner',
      existing: 'google',
      target: 'microsoft',
      stage: 'ready',
      proofId: 'opaque',
      reason: 'none',
    });
    const adapter = createAuthAdapter(app);
    await adapter.initialize();
    if (change === 'epoch')
      window.localStorage.setItem('taskify:logout:taskify-dev-dpdhole', 'new');
    if (change === 'user') auth.currentUser = { ...auth.currentUser };
    expect(adapter.takeLinkReturn!()?.proofId).toBe(
      change === 'none' ? 'opaque' : undefined,
    );
    expect(adapter.takeLinkReturn!()).toBeUndefined();
    adapter.dispose();
  },
);
it('Logout invalidates proof/return state without changing or deleting another account', async () => {
  const adapter = createAuthAdapter(app);
  await adapter.initialize();
  await adapter.signOut();
  expect(link.cancel).toHaveBeenCalledOnce();
  expect(sdk.signOut).toHaveBeenCalledWith(auth);
  adapter.dispose();
});

it('carries only the attempted provider through deliberate existing-method sign-in redirect', async () => {
  auth.currentUser.providerData = [{ providerId: 'microsoft.com' }];
  const adapter = createAuthAdapter(app);
  await adapter.initialize();
  sdk.signInWithPopup.mockRejectedValueOnce({
    code: 'auth/account-exists-with-different-credential',
  });
  await expect(adapter.signIn!('google', 'popup')).rejects.toMatchObject({
    reason: 'account-conflict',
  });
  expect(adapter.getLinkSuggestion?.()).toBe('google');
  await adapter.signIn!('microsoft', 'redirect');
  const marker = JSON.parse(
    window.sessionStorage.getItem(
      'taskify:provider-redirect:taskify-dev-dpdhole',
    )!,
  );
  expect(marker).toEqual({
    provider: 'microsoft',
    linkSuggestion: 'google',
    epoch: '',
    createdAt: expect.any(Number),
  });
  adapter.dispose();
});
it('restores an explicit provider-only redirect suggestion without restoring linking authority', async () => {
  auth.currentUser.providerData = [{ providerId: 'microsoft.com' }];
  window.sessionStorage.setItem(
    'taskify:provider-redirect:taskify-dev-dpdhole',
    JSON.stringify({
      provider: 'microsoft',
      linkSuggestion: 'google',
      epoch: '',
      createdAt: Date.now(),
    }),
  );
  const adapter = createAuthAdapter(app);
  await adapter.initialize();
  expect(adapter.getLinkSuggestion?.()).toBe('google');
  expect(adapter.takeLinkReturn!()).toBeUndefined();
  expect(link.submit).not.toHaveBeenCalled();
  adapter.clearLinkSuggestion?.();
  expect(adapter.getLinkSuggestion?.()).toBeUndefined();
  adapter.dispose();
});
it('retains the attempted provider after a redirect sign-in conflict for explicit retry with the existing method', async () => {
  auth.currentUser.providerData = [{ providerId: 'microsoft.com' }];
  window.sessionStorage.setItem(
    'taskify:provider-redirect:taskify-dev-dpdhole',
    JSON.stringify({ provider: 'google', epoch: '', createdAt: Date.now() }),
  );
  sdk.getRedirectResult.mockRejectedValueOnce({
    code: 'auth/account-exists-with-different-credential',
  });
  const adapter = createAuthAdapter(app);
  await expect(adapter.initialize()).rejects.toMatchObject({
    reason: 'account-conflict',
  });
  expect(adapter.getLinkSuggestion?.()).toBe('google');
  await adapter.initialize();
  expect(link.submit).not.toHaveBeenCalled();
  adapter.dispose();
});

// Focused deferral checks: primary account use must not require linking.
it.each(['google', 'microsoft'] as const)(
  'deferral boundary: cancelled linking proof releases ordinary %s sign-in',
  async (provider) => {
    const adapter = createAuthAdapter(app);
    await adapter.initialize();
    const original = auth.currentUser;
    link.prove.mockRejectedValue({ code: 'auth/popup-closed-by-user' });
    await expect(
      adapter.proveLink!('owner', 'microsoft', 'google', 'popup'),
    ).rejects.toBeDefined();
    adapter.cancelLink!();
    sdk.signInWithPopup.mockResolvedValue({ user: original });
    await expect(adapter.signIn!(provider, 'popup')).resolves.toBeUndefined();
    expect(auth.currentUser).toBe(original);
    expect(sdk.signInWithPopup).toHaveBeenCalledOnce();
    expect(link.submit).not.toHaveBeenCalled();
    expect(sdk.signOut).not.toHaveBeenCalled();
    adapter.dispose();
  },
);
it('deferral boundary: normal restoration and Logout do not require linking proof', async () => {
  const adapter = createAuthAdapter(app);
  const original = auth.currentUser;
  await adapter.initialize();
  expect(auth.currentUser).toBe(original);
  expect(link.prove).not.toHaveBeenCalled();
  expect(link.submit).not.toHaveBeenCalled();
  await adapter.signOut();
  expect(sdk.signOut).toHaveBeenCalledWith(auth);
  adapter.dispose();
});
it('deferral boundary: Logout remains available while linking proof is pending', async () => {
  const adapter = createAuthAdapter(app);
  await adapter.initialize();
  let rejectProof!: (reason: unknown) => void;
  link.prove.mockImplementation(
    () =>
      new Promise((_resolve, reject) => {
        rejectProof = reject;
      }),
  );
  const proof = adapter.proveLink!('owner', 'microsoft', 'google', 'popup');
  const settled = expect(proof).rejects.toBeDefined();
  await adapter.signOut();
  expect(sdk.signOut).toHaveBeenCalledWith(auth);
  expect(link.cancel).toHaveBeenCalled();
  rejectProof({ code: 'auth/popup-closed-by-user' });
  await settled;
  expect(link.submit).not.toHaveBeenCalled();
  adapter.dispose();
});
