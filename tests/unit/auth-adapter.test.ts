import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const sdk = vi.hoisted(() => ({
  initializeAuth: vi.fn(),
  connectAuthEmulator: vi.fn(),
  onAuthStateChanged: vi.fn(),
  setPersistence: vi.fn(),
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
vi.mock('firebase/auth', () => sdk);
import { createAuthAdapter } from '../../src/infrastructure/firebase/auth-adapter';
import type { FirebaseApp } from 'firebase/app';
const app = { options: { projectId: 'taskify-dev-dpdhole' } } as FirebaseApp;
let next: (user: unknown) => void;
let error: () => void;
const stop = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
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
  await initializing;
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
