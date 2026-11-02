import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import type { FirebaseApp } from 'firebase/app';
import type { User } from 'firebase/auth';
const sdk = vi.hoisted(() => ({
  initializeApp: vi.fn(),
  deleteApp: vi.fn(),
  initializeAuth: vi.fn(),
  browserSessionPersistence: {},
  browserPopupRedirectResolver: {},
  connectAuthEmulator: vi.fn(),
  updateCurrentUser: vi.fn(),
  reauthenticateWithPopup: vi.fn(),
  reauthenticateWithRedirect: vi.fn(),
  linkWithPopup: vi.fn(),
  linkWithRedirect: vi.fn(),
  getRedirectResult: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('firebase/app', () => ({
  initializeApp: sdk.initializeApp,
  deleteApp: sdk.deleteApp,
}));
vi.mock('firebase/auth', () => sdk);
import { createProviderLinkAdapter } from '../../src/infrastructure/firebase/provider-link-adapter';
import { SessionError } from '../../src/application/session-controller';
const app = {
  name: 'primary',
  options: { projectId: 'demo-taskify-link', apiKey: 'demo-only' },
} as FirebaseApp;
const key = 'taskify:link-redirect:demo-taskify-link:primary',
  epochKey = 'taskify:logout:demo-taskify-link';
let primary: User | null,
  contexts: { currentUser: User | null }[],
  storage: Map<string, string>;
function setup() {
  return createProviderLinkAdapter(
    app,
    { host: '127.0.0.1', port: 9099 },
    () => primary,
    (p) => ({ providerId: p === 'google' ? 'google.com' : 'microsoft.com' }),
    (e) =>
      e instanceof SessionError ? e : new SessionError('provider-unavailable'),
  );
}
function seed(extra = {}) {
  const value = {
    version: 1,
    uid: 'owner',
    epoch: '',
    nonce: 'operation-nonce',
    createdAt: Date.now(),
    target: 'microsoft',
    existing: 'google',
    stage: 'proof',
    ...extra,
  };
  storage.set(key, JSON.stringify(value));
  storage.set(key + ':cleanup', value.nonce);
  return value;
}
beforeEach(() => {
  vi.resetAllMocks();
  storage = new Map();
  const values = {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => {
      storage.set(k, v);
    },
    removeItem: (k: string) => {
      storage.delete(k);
    },
  };
  vi.stubGlobal('window', { localStorage: values, sessionStorage: values });
  primary = {
    uid: 'owner',
    displayName: 'Existing name',
    providerData: [{ providerId: 'google.com' }],
  } as User;
  contexts = [];
  sdk.initializeApp.mockImplementation((_options, name) => ({ name }));
  sdk.initializeAuth.mockImplementation(() => {
    const auth = { currentUser: null };
    contexts.push(auth);
    return auth;
  });
  sdk.updateCurrentUser.mockImplementation(async (auth, user) => {
    auth.currentUser = { ...user };
  });
  sdk.reauthenticateWithPopup.mockImplementation(async (user, provider) => ({
    user,
    providerId: provider.providerId,
    operationType: 'reauthenticate',
  }));
  sdk.linkWithPopup.mockImplementation(async (user, provider) => ({
    user,
    providerId: provider.providerId,
    operationType: 'link',
  }));
  sdk.getRedirectResult.mockResolvedValue(null);
  sdk.signOut.mockResolvedValue(undefined);
  sdk.deleteApp.mockResolvedValue(undefined);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it.each([
  ['google', 'microsoft'],
  ['microsoft', 'google'],
] as const)(
  'proves existing %s before linking %s on an isolated same-UID context',
  async (existing, target) => {
    const t = setup(),
      original = primary;
    const proof = await t.prove('owner', target, existing, 'popup');
    expect(proof).toEqual({ uid: 'owner', proofId: expect.any(String) });
    expect(sdk.linkWithPopup).not.toHaveBeenCalled();
    expect(contexts[0]!.currentUser).not.toBe(primary);
    expect(sdk.initializeAuth).toHaveBeenCalledWith(expect.anything(), {
      persistence: sdk.browserSessionPersistence,
      popupRedirectResolver: sdk.browserPopupRedirectResolver,
    });
    expect(await t.submit('owner', target, proof.proofId, 'popup')).toEqual({
      uid: 'owner',
    });
    expect(sdk.linkWithPopup).toHaveBeenCalledWith(
      expect.objectContaining({ uid: 'owner' }),
      expect.objectContaining({
        providerId: target === 'google' ? 'google.com' : 'microsoft.com',
      }),
      sdk.browserPopupRedirectResolver,
    );
    expect(sdk.signOut).toHaveBeenCalledWith(contexts[0]);
    expect(sdk.signOut).not.toHaveBeenCalledWith(primary);
    expect(sdk.deleteApp).toHaveBeenCalledOnce();
    expect(primary).toBe(original);
    expect(primary?.displayName).toBe('Existing name');
    await expect(
      t.submit('owner', target, proof.proofId, 'popup'),
    ).rejects.toMatchObject({ reason: 'proof-expired' });
  },
);
it.each([
  'wrong-id',
  'wrong-target',
  'wrong-uid',
  'expired',
  'logout',
  'switch',
] as const)(
  'rejects stale or misbound proof before link SDK use: %s',
  async (action) => {
    const t = setup(),
      proof = await t.prove('owner', 'microsoft', 'google', 'popup');
    if (action === 'expired')
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 300001);
    if (action === 'logout') storage.set(epochKey, 'new');
    if (action === 'switch') primary = { uid: 'other' } as User;
    await expect(
      t.submit(
        action === 'wrong-uid' ? 'other' : 'owner',
        action === 'wrong-target' ? 'google' : 'microsoft',
        action === 'wrong-id' ? 'bad' : proof.proofId,
        'popup',
      ),
    ).rejects.toMatchObject({ reason: 'proof-expired' });
    expect(sdk.linkWithPopup).not.toHaveBeenCalled();
    t.dispose();
  },
);
it('rejects wrong-account current proof without touching primary sign-in', async () => {
  sdk.reauthenticateWithPopup.mockResolvedValue({
    user: { uid: 'other' },
    providerId: 'google.com',
    operationType: 'reauthenticate',
  });
  const t = setup();
  await expect(
    t.prove('owner', 'microsoft', 'google', 'popup'),
  ).rejects.toMatchObject({ reason: 'wrong-account' });
  expect(sdk.linkWithPopup).not.toHaveBeenCalled();
  expect(primary?.uid).toBe('owner');
  expect(sdk.deleteApp).toHaveBeenCalledOnce();
});
it('rejects late proof after cancellation and cleans up only its isolated context', async () => {
  let finish!: (v: unknown) => void;
  sdk.reauthenticateWithPopup.mockImplementation(
    () =>
      new Promise((r) => {
        finish = r;
      }),
  );
  const t = setup();
  const p = t.prove('owner', 'microsoft', 'google', 'popup');
  await vi.waitFor(() =>
    expect(sdk.reauthenticateWithPopup).toHaveBeenCalledOnce(),
  );
  t.cancel();
  expect(sdk.signOut).not.toHaveBeenCalled();
  finish({
    user: { uid: 'owner' },
    providerId: 'google.com',
    operationType: 'reauthenticate',
  });
  await expect(p).rejects.toMatchObject({ reason: 'cancelled' });
  expect(sdk.linkWithPopup).not.toHaveBeenCalled();
  expect(sdk.signOut).toHaveBeenCalledWith(contexts[0]);
});
it('does not sign out or delete an isolated context during submitted SDK storage writes', async () => {
  const t = setup(),
    proof = await t.prove('owner', 'microsoft', 'google', 'popup');
  let finish!: (v: unknown) => void;
  sdk.linkWithPopup.mockImplementation(
    () =>
      new Promise((r) => {
        finish = r;
      }),
  );
  const p = t.submit('owner', 'microsoft', proof.proofId, 'popup');
  t.dispose();
  expect(sdk.signOut).not.toHaveBeenCalled();
  finish({
    user: { uid: 'owner' },
    providerId: 'microsoft.com',
    operationType: 'link',
  });
  await expect(p).rejects.toMatchObject({ reason: 'link-uncertain' });
  expect(primary?.uid).toBe('owner');
  expect(sdk.deleteApp).toHaveBeenCalledOnce();
});
it('stores only nonsecret correlation when starting current-account redirect proof', async () => {
  let reject!: (e: unknown) => void;
  sdk.reauthenticateWithRedirect.mockImplementation(
    () =>
      new Promise((_r, e) => {
        reject = e;
      }),
  );
  const t = setup();
  const p = t.prove('owner', 'microsoft', 'google', 'redirect');
  await vi.waitFor(() =>
    expect(sdk.reauthenticateWithRedirect).toHaveBeenCalledOnce(),
  );
  expect(JSON.parse(storage.get(key)!)).toEqual({
    version: 1,
    uid: 'owner',
    epoch: '',
    nonce: expect.any(String),
    createdAt: expect.any(Number),
    target: 'microsoft',
    existing: 'google',
    stage: 'proof',
  });
  expect(sdk.initializeApp).toHaveBeenCalledWith(
    app.options,
    expect.stringContaining('taskify-link:primary:'),
  );
  reject(new SessionError('cancelled'));
  await expect(p).rejects.toBeInstanceOf(SessionError);
});
it('restores actual redirect proof only to an explicit one-use continuation', async () => {
  const intent = seed();
  sdk.initializeAuth.mockImplementation(() => {
    const auth = { currentUser: { uid: 'owner' } as User };
    contexts.push(auth);
    return auth;
  });
  sdk.getRedirectResult.mockResolvedValue({
    user: { uid: 'owner' },
    providerId: 'google.com',
    operationType: 'reauthenticate',
  });
  const t = setup();
  const returned = await t.resume();
  expect(returned).toMatchObject({
    uid: 'owner',
    stage: 'ready',
    proofId: intent.nonce,
    target: 'microsoft',
  });
  expect(sdk.linkWithPopup).not.toHaveBeenCalled();
  expect(sdk.linkWithRedirect).not.toHaveBeenCalled();
  await t.submit('owner', 'microsoft', returned!.proofId!, 'popup');
  expect(sdk.linkWithPopup).toHaveBeenCalledOnce();
});
it.each([
  'uid',
  'epoch',
  'nonce',
  'provider',
  'expired',
  'missing-result',
  'wrong-result',
  'malformed',
] as const)(
  'never restores proof from invalid redirect correlation: %s',
  async (mode) => {
    const x = seed(
      mode === 'uid'
        ? { uid: 'other' }
        : mode === 'epoch'
          ? { epoch: 'old' }
          : mode === 'provider'
            ? { existing: 'apple' }
            : mode === 'expired'
              ? { createdAt: Date.now() - 300001 }
              : {},
    );
    if (mode === 'nonce') storage.set(key + ':cleanup', 'other-context');
    if (mode === 'malformed') storage.set(key, '{bad');
    sdk.initializeAuth.mockReturnValue({ currentUser: { uid: 'owner' } });
    if (mode !== 'missing-result')
      sdk.getRedirectResult.mockResolvedValue({
        user: { uid: mode === 'wrong-result' ? 'other' : 'owner' },
        providerId: 'google.com',
        operationType: 'reauthenticate',
      });
    const t = setup(),
      r = await t.resume();
    expect(r?.stage).not.toBe('ready');
    await expect(
      t.submit('owner', 'microsoft', x.nonce, 'popup'),
    ).rejects.toMatchObject({ reason: 'proof-expired' });
    expect(sdk.linkWithPopup).not.toHaveBeenCalled();
  },
);
it('a link redirect return only requests reconciliation, even when old or the SDK result is missing', async () => {
  seed({ stage: 'link', createdAt: Date.now() - 999999 });
  const t = setup();
  expect(await t.resume()).toMatchObject({
    stage: 'checking',
    target: 'microsoft',
    reason: 'link-uncertain',
  });
  expect(sdk.linkWithPopup).not.toHaveBeenCalled();
  expect(sdk.linkWithRedirect).not.toHaveBeenCalled();
  expect(sdk.reauthenticateWithPopup).not.toHaveBeenCalled();
});
it('reload without an actual redirect discards popup proof rather than restoring authority', async () => {
  const t = setup();
  const proof = await t.prove('owner', 'microsoft', 'google', 'popup');
  expect(storage.has(key)).toBe(false);
  const reloaded = setup();
  expect(await reloaded.resume()).toBeUndefined();
  await expect(
    reloaded.submit('owner', 'microsoft', proof.proofId, 'popup'),
  ).rejects.toMatchObject({ reason: 'proof-expired' });
  t.dispose();
});
it('blocks reuse while an SDK mutation is in flight', async () => {
  const t = setup(),
    proof = await t.prove('owner', 'microsoft', 'google', 'popup');
  let finish!: (v: unknown) => void;
  sdk.linkWithPopup.mockImplementation(
    () =>
      new Promise((r) => {
        finish = r;
      }),
  );
  const pending = t.submit('owner', 'microsoft', proof.proofId, 'popup');
  await expect(
    t.submit('owner', 'microsoft', proof.proofId, 'popup'),
  ).rejects.toMatchObject({ reason: 'proof-expired' });
  finish({
    user: { uid: 'owner' },
    providerId: 'microsoft.com',
    operationType: 'link',
  });
  await pending;
  expect(sdk.linkWithPopup).toHaveBeenCalledOnce();
});

it('retries retained cleanup before preparing a new proof and does not lose orphan context correlation', async () => {
  storage.set(key + ':cleanup', 'old-cleanup');
  const t = setup();
  const proof = await t.prove('owner', 'microsoft', 'google', 'popup');
  expect(sdk.signOut).toHaveBeenCalledWith(contexts[0]);
  expect(sdk.initializeAuth).toHaveBeenCalledTimes(2);
  expect(proof.proofId).not.toBe('old-cleanup');
  t.dispose();
});
it('preserves a submitted redirect marker on cancellation so return can be checked without replay', async () => {
  const t = setup(),
    proof = await t.prove('owner', 'microsoft', 'google', 'popup');
  let reject!: (e: unknown) => void;
  sdk.linkWithRedirect.mockImplementation(
    () =>
      new Promise((_r, fail) => {
        reject = fail;
      }),
  );
  const pending = t.submit('owner', 'microsoft', proof.proofId, 'redirect');
  expect(JSON.parse(storage.get(key)!).stage).toBe('link');
  t.cancel();
  expect(JSON.parse(storage.get(key)!).stage).toBe('link');
  expect(sdk.signOut).not.toHaveBeenCalled();
  reject(new SessionError('link-uncertain'));
  await expect(pending).rejects.toMatchObject({ reason: 'link-uncertain' });
  expect(sdk.deleteApp).toHaveBeenCalledOnce();
});

it('rejects unsupported providers before creating a context or submitting an SDK call', async () => {
  const t = setup();
  await expect(
    t.prove('owner', 'apple' as 'google', 'google', 'popup'),
  ).rejects.toMatchObject({ reason: 'configuration' });
  expect(sdk.initializeApp).not.toHaveBeenCalled();
  expect(sdk.linkWithPopup).not.toHaveBeenCalled();
});
