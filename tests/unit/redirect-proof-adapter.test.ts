import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import type { FirebaseApp } from 'firebase/app';
import type { User } from 'firebase/auth';
const sdk = vi.hoisted(() => ({
  initializeApp: vi.fn(),
  deleteApp: vi.fn(),
  initializeAuth: vi.fn(),
  connectAuthEmulator: vi.fn(),
  getRedirectResult: vi.fn(),
  updateCurrentUser: vi.fn(),
  reauthenticateWithRedirect: vi.fn(),
  signOut: vi.fn(),
  browserSessionPersistence: { type: 'SESSION' },
  browserPopupRedirectResolver: {},
}));
vi.mock('firebase/app', () => ({
  initializeApp: sdk.initializeApp,
  deleteApp: sdk.deleteApp,
}));
vi.mock('firebase/auth', () => sdk);
import { createRedirectProofAdapter } from '../../src/infrastructure/firebase/redirect-proof-adapter';
import { SessionError } from '../../src/application/session-controller';
const app = {
  name: 'primary',
  options: { projectId: 'demo-taskify-proof', apiKey: 'demo-only' },
} as FirebaseApp;
const key = 'taskify:proof-redirect:demo-taskify-proof:primary';
const epochKey = 'taskify:logout:demo-taskify-proof';
let primary: User | null;
let proof: { currentUser: User | null };
let storage: Map<string, string>;
const classify = (e: unknown) =>
  e instanceof SessionError ? e : new SessionError('wrong-account');
function adapter() {
  return createRedirectProofAdapter(
    app,
    { host: '127.0.0.1', port: 9099 },
    () => primary,
    classify,
  );
}
function marker(extra = {}) {
  return JSON.stringify({
    version: 1,
    uid: 'original',
    provider: 'google',
    epoch: '',
    nonce: 'correlation',
    createdAt: Date.now(),
    ...extra,
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  storage = new Map();
  const port = {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => {
      storage.set(k, v);
    },
    removeItem: (k: string) => {
      storage.delete(k);
    },
  };
  vi.stubGlobal('window', { sessionStorage: port, localStorage: port });
  primary = { uid: 'original' } as User;
  proof = { currentUser: { uid: 'original' } as User };
  sdk.initializeApp.mockReturnValue({ name: 'proof' });
  sdk.initializeAuth.mockReturnValue(proof);
  sdk.updateCurrentUser.mockImplementation(async (_auth, user) => {
    proof.currentUser = { ...user };
  });
  sdk.signOut.mockResolvedValue(undefined);
  sdk.deleteApp.mockResolvedValue(undefined);
  sdk.getRedirectResult.mockResolvedValue({
    user: { uid: 'original' },
    providerId: 'google.com',
    operationType: 'reauthenticate',
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it('does not create a proof context without return or cleanup intent', async () => {
  await expect(adapter().resume()).resolves.toBeUndefined();
  expect(sdk.initializeApp).not.toHaveBeenCalled();
});
it('uses a distinct session context and SDK-owned copy, with nonsecret redirect correlation only', async () => {
  const t = adapter();
  let reject!: (e: unknown) => void;
  sdk.reauthenticateWithRedirect.mockImplementation(
    () =>
      new Promise((_r, fail) => {
        reject = fail;
      }),
  );
  const original = primary;
  const pending = t.begin(primary!, 'google', { providerId: 'google.com' });
  await vi.waitFor(() =>
    expect(sdk.reauthenticateWithRedirect).toHaveBeenCalledOnce(),
  );
  expect(sdk.initializeApp).toHaveBeenCalledWith(
    app.options,
    'taskify-proof:primary',
  );
  expect(sdk.initializeAuth).toHaveBeenCalledWith(expect.anything(), {
    persistence: sdk.browserSessionPersistence,
    popupRedirectResolver: sdk.browserPopupRedirectResolver,
  });
  expect(proof.currentUser).not.toBe(primary);
  expect(JSON.parse(storage.get(key)!)).toEqual({
    version: 1,
    uid: 'original',
    provider: 'google',
    epoch: '',
    nonce: expect.any(String),
    createdAt: expect.any(Number),
  });
  expect(primary).toBe(original);
  reject(new SessionError('cancelled'));
  await expect(pending).rejects.toMatchObject({ reason: 'cancelled' });
  expect(sdk.signOut).toHaveBeenCalledWith(proof);
  expect(storage.has(key + ':cleanup')).toBe(false);
});
it.each(['cancel', 'dispose', 'logout', 'switch'] as const)(
  'rejects admission changes before redirect submission: %s',
  async (event) => {
    let finish!: () => void;
    sdk.updateCurrentUser.mockImplementation(async (_a, user) => {
      await new Promise<void>((r) => {
        finish = r;
      });
      proof.currentUser = { ...user };
    });
    const t = adapter();
    const pending = t.begin(primary!, 'google', { providerId: 'google.com' });
    if (event === 'cancel') t.cancel();
    if (event === 'dispose') t.dispose();
    if (event === 'logout') storage.set(epochKey, 'new-epoch');
    if (event === 'switch') primary = { uid: 'different' } as User;
    finish();
    await expect(pending).rejects.toMatchObject({ reason: 'cancelled' });
    expect(sdk.reauthenticateWithRedirect).not.toHaveBeenCalled();
  },
);
it.each([
  ['valid', {}],
  ['expired', { createdAt: Date.now() - 900001 }],
  ['future', { createdAt: Date.now() + 999999 }],
  ['uid', { uid: 'other' }],
  ['epoch', { epoch: 'old' }],
  ['version', { version: 99 }],
  ['provider', { provider: 'unknown' }],
  ['nonce', { nonce: '' }],
  ['malformed', null],
] as const)(
  'validates redirect return correlation: %s',
  async (name, extra) => {
    storage.set(key, extra === null ? '{broken' : marker(extra));
    const result = await adapter().resume();
    expect(result?.reason).toBe(name === 'valid' ? 'none' : undefined);
    expect(storage.has(key)).toBe(false);
    expect(sdk.signOut).toHaveBeenCalledWith(proof);
    expect(sdk.deleteApp).toHaveBeenCalledOnce();
  },
);
it.each(['uid', 'provider', 'operation', 'missing'] as const)(
  'rejects an incorrect SDK return: %s',
  async (variant) => {
    storage.set(key, marker());
    sdk.getRedirectResult.mockResolvedValue(
      variant === 'missing'
        ? null
        : {
            user: { uid: variant === 'uid' ? 'other' : 'original' },
            providerId: variant === 'provider' ? 'microsoft.com' : 'google.com',
            operationType:
              variant === 'operation' ? 'signIn' : 'reauthenticate',
          },
    );
    expect((await adapter().resume())?.reason).toBe(
      variant === 'missing' ? 'cancelled' : 'wrong-account',
    );
    expect(primary?.uid).toBe('original');
  },
);
it.each(['cancel', 'dispose', 'logout', 'switch'] as const)(
  'drops a late redirect return after %s',
  async (event) => {
    storage.set(key, marker());
    let finish!: (v: unknown) => void;
    sdk.getRedirectResult.mockImplementation(
      () =>
        new Promise((r) => {
          finish = r;
        }),
    );
    const t = adapter();
    const pending = t.resume();
    if (event === 'cancel') t.cancel();
    if (event === 'dispose') t.dispose();
    if (event === 'logout') storage.set(epochKey, 'new-epoch');
    if (event === 'switch') primary = { uid: 'new' } as User;
    finish({
      user: { uid: 'original' },
      providerId: 'google.com',
      operationType: 'reauthenticate',
    });
    expect(await pending).toBeUndefined();
  },
);
it('suppresses proof on cleanup failure and retries cleanup without restoring proof', async () => {
  storage.set(key, marker());
  sdk.signOut.mockRejectedValueOnce(Error('offline'));
  expect(await adapter().resume()).toBeUndefined();
  expect(storage.get(key + ':cleanup')).toBe('1');
  expect(storage.has(key)).toBe(false);
  expect(await adapter().resume()).toBeUndefined();
  expect(storage.has(key + ':cleanup')).toBe(false);
  expect(primary?.uid).toBe('original');
});

it('rejects a proof that expires while SDK return processing is pending', async () => {
  const started = Date.now();
  let now = started;
  vi.spyOn(Date, 'now').mockImplementation(() => now);
  storage.set(key, marker());
  let finish!: (v: unknown) => void;
  sdk.getRedirectResult.mockImplementation(
    () =>
      new Promise((r) => {
        finish = r;
      }),
  );
  const pending = adapter().resume();
  now += 900001;
  finish({
    user: { uid: 'original' },
    providerId: 'google.com',
    operationType: 'reauthenticate',
  });
  expect(await pending).toBeUndefined();
});
it('rejects a returned proof whose isolated current account changed', async () => {
  storage.set(key, marker());
  proof.currentUser = { uid: 'other' } as User;
  expect((await adapter().resume())?.reason).toBe('wrong-account');
  expect(primary?.uid).toBe('original');
});

it('defers disposal cleanup until an active SDK redirect settles', async () => {
  const t = adapter();
  let reject!: (e: unknown) => void;
  sdk.reauthenticateWithRedirect.mockImplementation(
    () =>
      new Promise((_r, fail) => {
        reject = fail;
      }),
  );
  const pending = t.begin(primary!, 'google', { providerId: 'google.com' });
  await vi.waitFor(() =>
    expect(sdk.reauthenticateWithRedirect).toHaveBeenCalledOnce(),
  );
  t.dispose();
  expect(storage.has(key)).toBe(false);
  expect(storage.get(key + ':cleanup')).toBe('1');
  expect(sdk.signOut).not.toHaveBeenCalled();
  reject(new SessionError('cancelled'));
  await expect(pending).rejects.toMatchObject({ reason: 'cancelled' });
  expect(sdk.signOut).toHaveBeenCalledWith(proof);
  expect(storage.has(key + ':cleanup')).toBe(false);
  expect(primary?.uid).toBe('original');
});
