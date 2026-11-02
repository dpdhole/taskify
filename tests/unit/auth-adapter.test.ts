import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const sdk = vi.hoisted(() => ({
  initializeAuth: vi.fn(),
  connectAuthEmulator: vi.fn(),
  onAuthStateChanged: vi.fn(),
  setPersistence: vi.fn(),
  reload: vi.fn(),
  reauthenticateWithPopup: vi.fn(),
  reauthenticateWithRedirect: vi.fn(),
  signOut: vi.fn(),
  browserLocalPersistence: {},
  browserPopupRedirectResolver: {},
  beforeAuthStateChanged: vi.fn(),
  getRedirectResult: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  OAuthProvider: class {
    providerId: string;
    parameters: unknown;
    constructor(providerId: string) {
      this.providerId = providerId;
    }
    setCustomParameters(parameters: unknown) {
      this.parameters = parameters;
    }
  },
  GoogleAuthProvider: class {
    setCustomParameters() {}
  },
}));
const proof = vi.hoisted(() => ({
  resume: vi.fn(),
  begin: vi.fn(),
  cancel: vi.fn(),
  dispose: vi.fn(),
}));
vi.mock('../../src/infrastructure/firebase/redirect-proof-adapter', () => ({
  createRedirectProofAdapter: () => proof,
}));
vi.mock('firebase/auth', () => sdk);
import { SessionError } from '../../src/application/session-controller';
import { createAuthAdapter } from '../../src/infrastructure/firebase/auth-adapter';
import type { FirebaseApp } from 'firebase/app';
const app = { options: { projectId: 'taskify-dev-dpdhole' } } as FirebaseApp;
let next: (user: unknown) => void;
let error: () => void;
const stop = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
  proof.resume.mockResolvedValue(undefined);
  const values = new Map<string, string>();
  vi.stubGlobal('window', {
    localStorage: {
      setItem: (k: string, v: string) => values.set(k, v),
      getItem: (k: string) => values.get(k),
      removeItem: (k: string) => values.delete(k),
    },
  });
  Object.assign(window, { sessionStorage: window.localStorage });
  sdk.beforeAuthStateChanged.mockReturnValue(vi.fn());
  sdk.initializeAuth.mockReturnValue({ authStateReady: async () => {} });
  sdk.onAuthStateChanged.mockImplementation((_auth, n, e) => {
    next = n;
    error = e;
    return stop;
  });
  sdk.setPersistence.mockResolvedValue(undefined);
  sdk.signOut.mockResolvedValue(undefined);
});
afterEach(() => vi.unstubAllGlobals());
it('uses explicit persistence and projects only the minimal identity without credentials', async () => {
  const adapter = createAuthAdapter(app);
  const observed = vi.fn();
  adapter.observe(observed, vi.fn());
  await adapter.initialize();
  expect(sdk.setPersistence).toHaveBeenCalledWith(
    expect.anything(),
    sdk.browserLocalPersistence,
  );
  next({
    uid: 'user',
    displayName: 'Name',
    email: 'test@example.invalid',
    accessToken: 'do-not-project',
    refreshToken: 'do-not-project',
  });
  expect(observed).toHaveBeenLastCalledWith({
    uid: 'user',
    displayName: 'Name',
    email: 'test@example.invalid',
  });
  next({ uid: 'user', displayName: null, email: null });
  expect(observed).toHaveBeenLastCalledWith({ uid: 'user' });
  next(null);
  expect(observed).toHaveBeenLastCalledWith(null);
  adapter.dispose();
});
it('fails closed on blocked storage and never silently selects memory persistence', async () => {
  vi.stubGlobal('window', {
    get localStorage() {
      throw Error('blocked');
    },
  });
  const adapter = createAuthAdapter(app);
  await expect(adapter.initialize()).rejects.toMatchObject({
    reason: 'persistence',
  });
  expect(sdk.setPersistence).not.toHaveBeenCalled();
  adapter.dispose();
});
it('redacts SDK errors and releases subscriptions without signing out on disposal', async () => {
  const adapter = createAuthAdapter(app);
  const failure = vi.fn(),
    observed = vi.fn();
  adapter.observe(observed, failure);
  error();
  expect(failure).toHaveBeenCalledWith();
  sdk.signOut.mockRejectedValue({ message: 'sensitive provider response' });
  await expect(adapter.signOut()).rejects.toMatchObject({ message: 'logout' });
  adapter.dispose();
  adapter.dispose();
  next({ uid: 'late' });
  expect(observed).not.toHaveBeenCalled();
  expect(stop).toHaveBeenCalledOnce();
  expect(sdk.signOut).toHaveBeenCalledOnce();
});
it('allows only explicitly paired loopback/demo emulator configuration', () => {
  expect(() =>
    createAuthAdapter(app, { host: '127.0.0.1', port: 9099 }),
  ).toThrow('configuration');
  const demo = {
    options: { projectId: 'demo-taskify-session' },
  } as FirebaseApp;
  expect(() => createAuthAdapter(demo)).toThrow('configuration');
  const adapter = createAuthAdapter(demo, { host: '127.0.0.1', port: 9099 });
  expect(sdk.connectAuthEmulator).toHaveBeenCalled();
  adapter.dispose();
});

it.each([
  ['auth/popup-closed-by-user', 'cancelled'],
  ['auth/popup-blocked', 'popup-blocked'],
  ['auth/account-exists-with-different-credential', 'account-conflict'],
  ['auth/unauthorized-domain', 'provider-configuration'],
  ['auth/network-request-failed', 'network'],
  ['unexpected-secret-response', 'provider-unavailable'],
])(
  'classifies Google failure %s without exposing SDK details',
  async (code, reason) => {
    const adapter = createAuthAdapter(app);
    await adapter.initialize();
    sdk.signInWithPopup.mockRejectedValue({
      code,
      message: 'private-provider-detail',
    });
    await expect(adapter.signIn!('google', 'popup')).rejects.toMatchObject({
      reason,
      message: reason,
    });
    adapter.dispose();
  },
);
it('blocks a late popup commit after local or cross-tab Logout and suppresses duplicate starts', async () => {
  const adapter = createAuthAdapter(app);
  await adapter.initialize();
  let finish!: () => void;
  sdk.signInWithPopup.mockImplementation(
    () =>
      new Promise<void>((r) => {
        finish = r;
      }),
  );
  const pending = adapter.signIn!('google', 'popup');
  await expect(adapter.signIn!('google', 'popup')).rejects.toMatchObject({
    reason: 'provider-unavailable',
  });
  const guard = sdk.beforeAuthStateChanged.mock.calls[0]![1] as (
    user: unknown,
  ) => void;
  expect(() => guard({ uid: 'candidate' })).not.toThrow();
  window.localStorage.setItem(
    'taskify:logout:taskify-dev-dpdhole',
    'other-tab-logout',
  );
  expect(() => guard({ uid: 'candidate' })).toThrow('cancelled');
  expect(() => guard(null)).not.toThrow();
  await adapter.signOut();
  expect(() => guard({ uid: 'candidate' })).toThrow('cancelled');
  finish();
  await pending;
  adapter.dispose();
});
it('keeps the middleware until a disposed popup settles', async () => {
  const adapter = createAuthAdapter(app);
  await adapter.initialize();
  let finish!: () => void;
  sdk.signInWithPopup.mockImplementation(
    () =>
      new Promise<void>((r) => {
        finish = r;
      }),
  );
  const pending = adapter.signIn!('google', 'popup');
  const stopGuard = sdk.beforeAuthStateChanged.mock.results[0]!.value;
  const guard = sdk.beforeAuthStateChanged.mock.calls[0]![1] as (
    user: unknown,
  ) => void;
  adapter.dispose();
  expect(stopGuard).not.toHaveBeenCalled();
  expect(() => guard({ uid: 'late' })).toThrow('cancelled');
  finish();
  await pending;
  expect(stopGuard).toHaveBeenCalledOnce();
});
it('records only noncredential redirect intent and consumes the SDK result on return', async () => {
  const adapter = createAuthAdapter(app);
  await adapter.initialize();
  await adapter.signIn!('google', 'redirect');
  const key = 'taskify:provider-redirect:taskify-dev-dpdhole';
  expect(JSON.parse(window.sessionStorage.getItem(key)!)).toEqual({
    provider: 'google',
    epoch: '',
    createdAt: expect.any(Number),
  });
  adapter.dispose();
  const returned = createAuthAdapter(app);
  await returned.initialize();
  expect(sdk.getRedirectResult).toHaveBeenCalledOnce();
  expect(window.sessionStorage.getItem(key)).toBeUndefined();
  returned.dispose();
});
it('rejects expired redirect returns before committing a user', async () => {
  const key = 'taskify:google-redirect:taskify-dev-dpdhole';
  window.sessionStorage.setItem(
    key,
    JSON.stringify({ epoch: '', createdAt: Date.now() - 900001 }),
  );
  const adapter = createAuthAdapter(app);
  sdk.getRedirectResult.mockImplementation(async () => {
    const guard = sdk.beforeAuthStateChanged.mock.calls[0]![1] as (
      user: unknown,
    ) => void;
    guard({ uid: 'late' });
  });
  await expect(adapter.initialize()).rejects.toMatchObject({
    reason: 'cancelled',
  });
  expect(window.sessionStorage.getItem(key)).toBeUndefined();
  adapter.dispose();
});

it.each(['null', '{invalid-json', '{}'])(
  'fails closed on malformed redirect intent %s and consumes the result',
  async (marker) => {
    window.sessionStorage.setItem(
      'taskify:google-redirect:taskify-dev-dpdhole',
      marker,
    );
    const adapter = createAuthAdapter(app);
    sdk.getRedirectResult.mockImplementation(async () => {
      const guard = sdk.beforeAuthStateChanged.mock.calls[0]![1] as (
        user: unknown,
      ) => void;
      guard({ uid: 'unexpected' });
    });
    await expect(adapter.initialize()).rejects.toMatchObject({
      reason: 'cancelled',
    });
    expect(sdk.getRedirectResult).toHaveBeenCalledOnce();
    adapter.dispose();
  },
);

it('retains the admission middleware while a redirect result is being processed on disposal', async () => {
  window.sessionStorage.setItem(
    'taskify:google-redirect:taskify-dev-dpdhole',
    JSON.stringify({ epoch: '', createdAt: Date.now() }),
  );
  let finish!: () => void;
  sdk.getRedirectResult.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const adapter = createAuthAdapter(app);
  const initializing = adapter.initialize();
  await vi.waitFor(() => expect(sdk.getRedirectResult).toHaveBeenCalledOnce());
  const stopGuard = sdk.beforeAuthStateChanged.mock.results[0]!.value;
  const guard = sdk.beforeAuthStateChanged.mock.calls[0]![1] as (
    user: unknown,
  ) => void;
  adapter.dispose();
  expect(stopGuard).not.toHaveBeenCalled();
  expect(() => guard({ uid: 'late-redirect' })).toThrow('cancelled');
  finish();
  await expect(initializing).rejects.toMatchObject({ reason: 'cancelled' });
  expect(stopGuard).toHaveBeenCalledOnce();
});

it('uses Microsoft OAuth with common tenant, account selection and no additional Graph scopes', async () => {
  const adapter = createAuthAdapter(app);
  await adapter.initialize();
  await adapter.signIn!('microsoft', 'popup');
  expect(sdk.signInWithPopup).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      providerId: 'microsoft.com',
      parameters: { tenant: 'common', prompt: 'select_account' },
    }),
    sdk.browserPopupRedirectResolver,
  );
  adapter.dispose();
});
it('records Microsoft redirect intent and restores it through the SDK', async () => {
  const adapter = createAuthAdapter(app);
  await adapter.initialize();
  await adapter.signIn!('microsoft', 'redirect');
  const key = 'taskify:provider-redirect:taskify-dev-dpdhole';
  expect(JSON.parse(window.sessionStorage.getItem(key)!)).toEqual({
    provider: 'microsoft',
    epoch: '',
    createdAt: expect.any(Number),
  });
  expect(sdk.signInWithRedirect.mock.calls[0]![1]).toMatchObject({
    providerId: 'microsoft.com',
  });
  adapter.dispose();
  const returned = createAuthAdapter(app);
  await returned.initialize();
  expect(sdk.getRedirectResult).toHaveBeenCalledOnce();
  expect(window.sessionStorage.getItem(key)).toBeUndefined();
  returned.dispose();
});
it('blocks overlapping providers and a late Microsoft commit after Logout', async () => {
  const adapter = createAuthAdapter(app);
  await adapter.initialize();
  let finish!: () => void;
  sdk.signInWithPopup.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const pending = adapter.signIn!('microsoft', 'popup');
  await expect(adapter.signIn!('google', 'popup')).rejects.toMatchObject({
    reason: 'provider-unavailable',
  });
  await adapter.signOut();
  const guard = sdk.beforeAuthStateChanged.mock.calls[0]![1] as (
    user: unknown,
  ) => void;
  expect(() => guard({ uid: 'late-microsoft' })).toThrow('cancelled');
  finish();
  await pending;
  adapter.dispose();
});
it('keeps Microsoft account conflicts and provider failures sanitized without linking', async () => {
  const adapter = createAuthAdapter(app);
  await adapter.initialize();
  sdk.signInWithPopup.mockRejectedValue({
    code: 'auth/account-exists-with-different-credential',
    credential: { accessToken: 'private' },
    email: 'private@example.invalid',
  });
  await expect(adapter.signIn!('microsoft', 'popup')).rejects.toMatchObject({
    reason: 'account-conflict',
    message: 'account-conflict',
  });
  sdk.signInWithPopup.mockRejectedValue({
    code: 'auth/operation-not-allowed',
    message: 'private tenant detail',
  });
  await expect(adapter.signIn!('microsoft', 'popup')).rejects.toMatchObject({
    reason: 'provider-configuration',
    message: 'provider-configuration',
  });
  adapter.dispose();
});
it('rejects an unknown provider in redirect metadata before SDK commitment', async () => {
  window.sessionStorage.setItem(
    'taskify:provider-redirect:taskify-dev-dpdhole',
    JSON.stringify({ provider: 'unknown', epoch: '', createdAt: Date.now() }),
  );
  const adapter = createAuthAdapter(app);
  sdk.getRedirectResult.mockImplementation(async () => {
    const guard = sdk.beforeAuthStateChanged.mock.calls[0]![1] as (
      user: unknown,
    ) => void;
    guard({ uid: 'invalid' });
  });
  await expect(adapter.initialize()).rejects.toMatchObject({
    reason: 'cancelled',
  });
  adapter.dispose();
});

it('consumes a valid Google redirect marker from the previously deployed build', async () => {
  const key = 'taskify:google-redirect:taskify-dev-dpdhole';
  window.sessionStorage.setItem(
    key,
    JSON.stringify({ epoch: '', createdAt: Date.now() }),
  );
  const adapter = createAuthAdapter(app);
  sdk.getRedirectResult.mockImplementation(async () => {
    const guard = sdk.beforeAuthStateChanged.mock.calls[0]![1] as (
      user: unknown,
    ) => void;
    guard({ uid: 'legacy-google-return' });
  });
  await adapter.initialize();
  expect(sdk.getRedirectResult).toHaveBeenCalledOnce();
  expect(window.sessionStorage.getItem(key)).toBeUndefined();
  adapter.dispose();
});

it('refreshes provider status from the current SDK account without projecting credentials or profile fields', async () => {
  const user = {
    uid: 'current',
    providerData: [
      { providerId: 'google.com', email: 'private@example.invalid' },
      { providerId: 'microsoft.com' },
      { providerId: 'apple.com' },
    ],
  };
  const sdkAuth = { currentUser: user, authStateReady: async () => {} };
  sdk.initializeAuth.mockReturnValue(sdkAuth);
  const adapter = createAuthAdapter(app);
  await adapter.initialize();
  await expect(adapter.readSignInMethods('current')).resolves.toEqual({
    uid: 'current',
    providers: ['google', 'microsoft'],
  });
  expect(sdk.reload).toHaveBeenCalledWith(user);
  await expect(adapter.readSignInMethods('different')).rejects.toMatchObject({
    reason: 'restoration',
  });
  expect(sdk.reload).toHaveBeenCalledOnce();
  adapter.dispose();
});
it('rejects refreshed provider information after an account switch or Logout epoch change', async () => {
  const user = { uid: 'current', providerData: [{ providerId: 'google.com' }] };
  const sdkAuth = { currentUser: user, authStateReady: async () => {} };
  sdk.initializeAuth.mockReturnValue(sdkAuth);
  const adapter = createAuthAdapter(app);
  await adapter.initialize();
  sdk.reload.mockImplementation(async () => {
    sdkAuth.currentUser = { ...user };
  });
  await expect(adapter.readSignInMethods('current')).rejects.toMatchObject({
    reason: 'cancelled',
  });
  sdkAuth.currentUser = user;
  sdk.reload.mockImplementation(async () => {
    window.localStorage.setItem(
      'taskify:logout:taskify-dev-dpdhole',
      'new-logout',
    );
  });
  await expect(adapter.readSignInMethods('current')).rejects.toMatchObject({
    reason: 'cancelled',
  });
  adapter.dispose();
});
it('classifies status lookup network failures without claiming a provider is unlinked', async () => {
  sdk.initializeAuth.mockReturnValue({
    currentUser: { uid: 'current', providerData: [] },
    authStateReady: async () => {},
  });
  const adapter = createAuthAdapter(app);
  await adapter.initialize();
  sdk.reload.mockRejectedValue({
    code: 'auth/network-request-failed',
    message: 'private response',
  });
  await expect(adapter.readSignInMethods('current')).rejects.toMatchObject({
    reason: 'network',
    message: 'network',
  });
  adapter.dispose();
});

function proofAccount() {
  const user = {
    uid: 'original',
    providerData: [
      { providerId: 'google.com' },
      { providerId: 'microsoft.com' },
    ],
  };
  const auth = { currentUser: user, authStateReady: async () => {} };
  sdk.initializeAuth.mockReturnValue(auth);
  return { user, auth };
}
it.each(['google', 'microsoft'] as const)(
  'reauthenticates the original account with %s without signing in another user',
  async (provider) => {
    const { user } = proofAccount();
    const adapter = createAuthAdapter(app);
    await adapter.initialize();
    sdk.reauthenticateWithPopup.mockResolvedValue({
      user,
      operationType: 'reauthenticate',
    });
    await expect(
      adapter.reauthenticate!('original', provider, 'popup'),
    ).resolves.toEqual({ uid: 'original' });
    expect(sdk.reauthenticateWithPopup).toHaveBeenCalledWith(
      user,
      expect.anything(),
      sdk.browserPopupRedirectResolver,
    );
    expect(sdk.signInWithPopup).not.toHaveBeenCalled();
    adapter.dispose();
  },
);
it('rejects a wrong reauthentication UID and keeps the original SDK account', async () => {
  const { user, auth } = proofAccount();
  const adapter = createAuthAdapter(app);
  await adapter.initialize();
  sdk.reauthenticateWithPopup.mockResolvedValue({
    user: { uid: 'wrong' },
    operationType: 'reauthenticate',
  });
  await expect(
    adapter.reauthenticate!('original', 'google', 'popup'),
  ).rejects.toMatchObject({ reason: 'wrong-account' });
  expect(auth.currentUser).toBe(user);
  expect(sdk.signOut).not.toHaveBeenCalled();
  adapter.dispose();
});
it.each(['cancel', 'logout', 'switch', 'dispose'] as const)(
  'does not return late proof after %s',
  async (event) => {
    const { user, auth } = proofAccount();
    const adapter = createAuthAdapter(app);
    await adapter.initialize();
    let resolve!: (value: unknown) => void;
    sdk.reauthenticateWithPopup.mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    const pending = adapter.reauthenticate!('original', 'google', 'popup');
    if (event === 'cancel') adapter.cancelReauthentication!();
    if (event === 'logout') await adapter.signOut();
    if (event === 'switch') auth.currentUser = { ...user };
    if (event === 'dispose') adapter.dispose();
    resolve({ user, operationType: 'reauthenticate' });
    await expect(pending).rejects.toMatchObject({ reason: 'cancelled' });
    adapter.dispose();
  },
);
it('blocks overlapping provider operations during reauthentication', async () => {
  const { user } = proofAccount();
  const adapter = createAuthAdapter(app);
  await adapter.initialize();
  let resolve!: (v: unknown) => void;
  sdk.reauthenticateWithPopup.mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const pending = adapter.reauthenticate!('original', 'google', 'popup');
  await expect(adapter.signIn!('microsoft', 'popup')).rejects.toMatchObject({
    reason: 'provider-unavailable',
  });
  await expect(
    adapter.reauthenticate!('original', 'microsoft', 'popup'),
  ).rejects.toMatchObject({ reason: 'wrong-account' });
  resolve({ user, operationType: 'reauthenticate' });
  await pending;
  adapter.dispose();
});
it('delegates redirect proof to the isolated context without signing in another primary user', async () => {
  const { user } = proofAccount();
  const adapter = createAuthAdapter(app);
  await adapter.initialize();
  proof.begin.mockRejectedValue(new SessionError('cancelled'));
  await expect(
    adapter.reauthenticate!('original', 'microsoft', 'redirect'),
  ).rejects.toMatchObject({ reason: 'cancelled' });
  expect(proof.begin).toHaveBeenCalledWith(
    user,
    'microsoft',
    expect.anything(),
  );
  expect(sdk.reauthenticateWithPopup).not.toHaveBeenCalled();
  expect(sdk.signInWithPopup).not.toHaveBeenCalled();
  adapter.dispose();
});
it('consumes a redirect proof result only after a current UID/epoch status reload', async () => {
  proofAccount();
  proof.resume.mockResolvedValue({
    uid: 'original',
    epoch: '',
    createdAt: Date.now(),
    provider: 'google',
    reason: 'none',
  });
  const adapter = createAuthAdapter(app);
  await adapter.initialize();
  await expect(adapter.readSignInMethods('original')).resolves.toMatchObject({
    verificationReturn: { provider: 'google', reason: 'none' },
  });
  expect(await adapter.readSignInMethods('original')).not.toHaveProperty(
    'verificationReturn',
  );
  adapter.dispose();
});
it('rejects unsupported reauthentication redirect metadata on startup', async () => {
  proofAccount();
  window.sessionStorage.setItem(
    'taskify:provider-redirect:taskify-dev-dpdhole',
    JSON.stringify({
      operation: 'reauthenticate',
      provider: 'google',
      uid: 'original',
      epoch: '',
      createdAt: Date.now(),
    }),
  );
  const adapter = createAuthAdapter(app);
  await expect(adapter.initialize()).rejects.toMatchObject({
    reason: 'cancelled',
  });
  adapter.dispose();
});

it('coalesces initialization retries while redirect proof return is still processing', async () => {
  let finish!: (value: undefined) => void;
  proof.resume.mockImplementation(
    () =>
      new Promise((r) => {
        finish = r;
      }),
  );
  const adapter = createAuthAdapter(app);
  const first = adapter.initialize();
  await vi.waitFor(() => expect(proof.resume).toHaveBeenCalledOnce());
  const retry = adapter.initialize();
  expect(first).toBe(retry);
  finish(undefined);
  await Promise.all([first, retry]);
  expect(proof.resume).toHaveBeenCalledOnce();
  adapter.dispose();
});
