import { beforeEach, expect, it, vi } from 'vitest';
import type { FirebaseApp } from 'firebase/app';
import type { User } from 'firebase/auth';
const sdk = vi.hoisted(() => ({
  initializeApp: vi.fn(),
  deleteApp: vi.fn(),
  initializeAuth: vi.fn(),
  inMemoryPersistence: {},
  connectAuthEmulator: vi.fn(),
  updateCurrentUser: vi.fn(),
  reload: vi.fn(),
}));
vi.mock('firebase/app', () => ({
  initializeApp: sdk.initializeApp,
  deleteApp: sdk.deleteApp,
}));
vi.mock('firebase/auth', () => sdk);
import { readAuthMethods } from '../../src/infrastructure/firebase/auth-methods-reader';
const app = {
  name: 'primary',
  options: { projectId: 'demo-taskify-session' },
} as FirebaseApp;
let isolated: { currentUser: User | null };
beforeEach(() => {
  vi.resetAllMocks();
  isolated = { currentUser: null };
  sdk.initializeApp.mockReturnValue({ name: 'isolated' });
  sdk.initializeAuth.mockReturnValue(isolated);
  sdk.updateCurrentUser.mockImplementation(async (_auth, user) => {
    isolated.currentUser = { ...user };
  });
  sdk.deleteApp.mockResolvedValue(undefined);
});
it('reloads an isolated memory-only SDK copy, returning UID/providers without notifying primary Auth', async () => {
  const user = {
    uid: 'original',
    providerData: [{ providerId: 'google.com' }],
  } as User;
  sdk.reload.mockImplementation(async (copy) => {
    copy.providerData = [
      { providerId: 'microsoft.com', email: 'not-projected@example.invalid' },
      { providerId: 'apple.com' },
    ];
  });
  expect(
    await readAuthMethods(app, user, { host: '127.0.0.1', port: 9099 }),
  ).toEqual({ uid: 'original', providers: ['microsoft'] });
  expect(sdk.reload).toHaveBeenCalledWith(isolated.currentUser);
  expect(isolated.currentUser).not.toBe(user);
  expect(user.providerData).toEqual([{ providerId: 'google.com' }]);
  expect(sdk.initializeAuth).toHaveBeenCalledWith(expect.anything(), {
    persistence: sdk.inMemoryPersistence,
  });
  expect(sdk.connectAuthEmulator).toHaveBeenCalledOnce();
  expect(sdk.deleteApp).toHaveBeenCalledOnce();
});
it.each(['same-object', 'wrong-uid', 'missing', 'network'] as const)(
  'cleans up failed isolated metadata reads: %s',
  async (mode) => {
    const user = { uid: 'original', providerData: [] } as unknown as User;
    sdk.updateCurrentUser.mockImplementation(async () => {
      isolated.currentUser =
        mode === 'missing'
          ? null
          : mode === 'same-object'
            ? user
            : { ...user, uid: mode === 'wrong-uid' ? 'other' : 'original' };
    });
    if (mode === 'network') sdk.reload.mockRejectedValue(Error('network'));
    await expect(readAuthMethods(app, user)).rejects.toBeInstanceOf(Error);
    expect(sdk.deleteApp).toHaveBeenCalledOnce();
    if (mode !== 'network') expect(sdk.reload).not.toHaveBeenCalled();
  },
);
