import { beforeEach, expect, it, vi } from 'vitest';
import type { FirebaseApp } from 'firebase/app';
const sdk = vi.hoisted(() => {
  type U = { uid: string; proven?: boolean };
  const primary: { currentUser: U | null } = { currentUser: { uid: 'A' } };
  const owned: { currentUser: U | null; authStateReady: () => Promise<void> } =
    { currentUser: null, authStateReady: async () => {} };
  return {
    primary,
    owned,
    getAuth: vi.fn(() => primary),
    initializeAuth: vi.fn(() => owned),
    updateCurrentUser: vi.fn(),
    reauthenticateWithPopup: vi.fn(),
    reauthenticateWithRedirect: vi.fn(),
    getRedirectResult: vi.fn(),
    getIdTokenResult: vi.fn(),
    beforeAuthStateChanged: vi.fn(),
    connectAuthEmulator: vi.fn(),
    signOut: vi.fn(),
    browserSessionPersistence: {},
    browserPopupRedirectResolver: {},
  };
});
const apps = vi.hoisted(() => ({ initializeApp: vi.fn(), deleteApp: vi.fn() }));
const methods = vi.hoisted(() => vi.fn());
vi.mock('firebase/app', () => apps);
vi.mock('firebase/auth', () => ({
  ...sdk,
  GoogleAuthProvider: class {
    setCustomParameters() {}
  },
  OAuthProvider: class {
    constructor(_id: string) {}
    setCustomParameters() {}
  },
}));
vi.mock('../../src/infrastructure/firebase/auth-methods-reader', () => ({
  readAuthMethods: methods,
}));
import { createDeletionProofAdapter } from '../../src/infrastructure/firebase/deletion-proof-adapter';
const app = {
  options: { projectId: 'taskify-dev-dpdhole' },
  name: 'primary',
} as FirebaseApp;
const job = '11111111-1111-4111-8111-111111111111';
const flush = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};
function storage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => {
      m.set(k, v);
    },
    removeItem: (k: string) => {
      m.delete(k);
    },
  };
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('window', {
    sessionStorage: storage(),
    localStorage: storage(),
  });
  sdk.primary.currentUser = { uid: 'A' };
  sdk.owned.currentUser = null;
  apps.initializeApp.mockReturnValue({ name: 'proof' });
  apps.deleteApp.mockResolvedValue(undefined);
  sdk.getAuth.mockReturnValue(sdk.primary);
  sdk.initializeAuth.mockReturnValue(sdk.owned);
  sdk.beforeAuthStateChanged.mockReturnValue(vi.fn());
  sdk.updateCurrentUser.mockImplementation(async (auth, user) => {
    auth.currentUser = { ...user };
  });
  sdk.signOut.mockImplementation(async (auth) => {
    auth.currentUser = null;
  });
  methods.mockResolvedValue({ uid: 'A', providers: ['google', 'microsoft'] });
  sdk.reauthenticateWithPopup.mockImplementation(async () => {
    sdk.owned.currentUser = { uid: 'A', proven: true };
    return {
      user: sdk.owned.currentUser,
      providerId: 'google.com',
      operationType: 'reauthenticate',
    };
  });
  sdk.getIdTokenResult.mockImplementation(async (user) => {
    expect(user).toBe(sdk.primary.currentUser);
    expect(user.proven).toBe(true);
    return {
      claims: { auth_time: Math.floor(Date.now() / 1000) },
      signInProvider: 'google.com',
    };
  });
});
it.each(['google.com', 'microsoft.com'] as const)(
  'copies %s proof into primary Auth before force-refreshing its token',
  async (provider) => {
    const p = createDeletionProofAdapter(app);
    try {
      sdk.reauthenticateWithPopup.mockImplementation(async () => {
        sdk.owned.currentUser = { uid: 'A', proven: true };
        return {
          user: sdk.owned.currentUser,
          providerId: provider,
          operationType: 'reauthenticate',
        };
      });
      sdk.getIdTokenResult.mockResolvedValue({
        claims: { auth_time: Math.floor(Date.now() / 1000) },
        signInProvider: provider,
      });
      const result = await p.prove('A', job, provider, 'popup');
      expect(result).toMatchObject({
        uid: 'A',
        jobId: job,
        provider,
      });
      expect(sdk.updateCurrentUser.mock.calls.map((c) => c[0])).toEqual([
        sdk.owned,
        sdk.primary,
      ]);
      expect(sdk.getIdTokenResult).toHaveBeenCalledWith(
        sdk.primary.currentUser,
        true,
      );
      expect(sdk.signOut).toHaveBeenCalledWith(sdk.owned);
      expect(sdk.primary.currentUser?.uid).toBe('A');
    } finally {
      p.dispose();
    }
  },
);
it('expired signed claims never authorize deletion proof', async () => {
  const p = createDeletionProofAdapter(app);
  try {
    sdk.getIdTokenResult.mockResolvedValue({
      claims: { auth_time: 1 },
      signInProvider: 'google.com',
    });
    await expect(
      p.prove('A', job, 'google.com', 'popup'),
    ).rejects.toMatchObject({ reason: 'proof-invalid' });
  } finally {
    p.dispose();
  }
});
it.each([
  { uid: 'B', providerId: 'google.com', operationType: 'reauthenticate' },
  { uid: 'A', providerId: 'microsoft.com', operationType: 'reauthenticate' },
  { uid: 'A', providerId: 'google.com', operationType: 'signIn' },
])('rejects mismatched provider operation %j', async (r) => {
  const p = createDeletionProofAdapter(app);
  try {
    sdk.reauthenticateWithPopup.mockResolvedValue({
      user: { uid: r.uid },
      ...r,
    });
    await expect(
      p.prove('A', job, 'google.com', 'popup'),
    ).rejects.toMatchObject({ reason: 'proof-invalid' });
    expect(sdk.getIdTokenResult).not.toHaveBeenCalled();
  } finally {
    p.dispose();
  }
});
it('Logout during provider interaction prevents primary token transfer', async () => {
  const p = createDeletionProofAdapter(app);
  let release!: (v: unknown) => void;
  sdk.reauthenticateWithPopup.mockImplementation(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const work = p.prove('A', job, 'google.com', 'popup');
  await flush();
  window.localStorage.setItem(
    'taskify:logout:taskify-dev-dpdhole',
    'new-epoch',
  );
  sdk.primary.currentUser = null;
  sdk.owned.currentUser = { uid: 'A', proven: true };
  release({
    user: sdk.owned.currentUser,
    operationType: 'reauthenticate',
    providerId: 'google.com',
  });
  await expect(work).rejects.toMatchObject({ reason: 'cancelled' });
  expect(
    sdk.updateCurrentUser.mock.calls.filter((c) => c[0] === sdk.primary),
  ).toHaveLength(0);
  p.dispose();
});
it('requires a linked provider and classifies popup blocking without intent authority', async () => {
  const p = createDeletionProofAdapter(app);
  try {
    methods.mockResolvedValue({ uid: 'A', providers: [] });
    await expect(
      p.prove('A', job, 'google.com', 'popup'),
    ).rejects.toMatchObject({ reason: 'proof-invalid' });
    methods.mockResolvedValue({ uid: 'A', providers: ['google'] });
    sdk.reauthenticateWithPopup.mockRejectedValue({
      code: 'auth/popup-blocked',
    });
    await expect(
      p.prove('A', job, 'google.com', 'popup'),
    ).rejects.toMatchObject({ reason: 'popup-blocked' });
  } finally {
    p.dispose();
  }
});
it('redirect markers alone never authorize primary transfer', async () => {
  const p = createDeletionProofAdapter(app);
  try {
    sdk.reauthenticateWithRedirect.mockResolvedValue(undefined);
    await expect(
      p.prove('A', job, 'google.com', 'redirect'),
    ).rejects.toMatchObject({ reason: 'cancelled' });
    expect(
      window.sessionStorage.getItem(
        'taskify:deletion-proof:taskify-dev-dpdhole:primary',
      ),
    ).not.toBeNull();
    sdk.getRedirectResult.mockResolvedValue(null);
    await expect(p.resume('A')).rejects.toMatchObject({
      reason: 'proof-invalid',
    });
    expect(sdk.getIdTokenResult).not.toHaveBeenCalled();
  } finally {
    p.dispose();
  }
});
it('verified redirect result transfers the SDK proof and consumes its marker once', async () => {
  const p = createDeletionProofAdapter(app);
  try {
    sdk.reauthenticateWithRedirect.mockResolvedValue(undefined);
    await expect(
      p.prove('A', job, 'google.com', 'redirect'),
    ).rejects.toBeDefined();
    sdk.owned.currentUser = { uid: 'A', proven: true };
    sdk.getRedirectResult.mockResolvedValue({
      user: sdk.owned.currentUser,
      providerId: 'google.com',
      operationType: 'reauthenticate',
    });
    expect(await p.resume('A')).toMatchObject({ uid: 'A', jobId: job });
    expect(await p.resume('A')).toBeUndefined();
    expect(sdk.getIdTokenResult).toHaveBeenCalledTimes(1);
  } finally {
    p.dispose();
  }
});
