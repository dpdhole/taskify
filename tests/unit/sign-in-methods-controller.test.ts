import { expect, it, vi } from 'vitest';
import { createSignInMethodsController } from '../../src/application/sign-in-methods-controller';
import type { SignInMethodsSnapshot } from '../../src/application/sign-in-methods-controller';
import {
  createSessionController,
  SessionError,
} from '../../src/application/session-controller';
import type { SessionIdentity } from '../../src/application/session-controller';
import { createCompatibilityGate } from '../../src/application/compatibility-gate';
import { capabilities, contract } from '../support/compatibility-fixtures';
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}
async function setup() {
  const timers: { callback: () => void; stopped: boolean }[] = [];
  const clock = {
    schedule(callback: () => void) {
      const timer = { callback, stopped: false };
      timers.push(timer);
      return () => {
        timer.stopped = true;
      };
    },
  };
  let next!: (value: SessionIdentity | null) => void;
  let authoritative = true;
  let emitContract!: (raw: unknown, authoritative: boolean) => void;
  const gate = createCompatibilityGate(
    {
      readServer: async () => contract(),
      watch(n) {
        emitContract = n;
        n(contract(), authoritative);
        return () => {};
      },
    },
    capabilities,
    clock,
  );
  const session = createSessionController(
    {
      initialize: async () => {},
      observe(n) {
        next = n;
        return () => {};
      },
      signOut: async () => {
        next(null);
      },
      dispose() {},
    },
    gate,
    clock,
    () => {},
  );
  const requests: ReturnType<typeof deferred<SignInMethodsSnapshot>>[] = [];
  const read = vi.fn(() => {
    const d = deferred<SignInMethodsSnapshot>();
    requests.push(d);
    return d.promise;
  });
  const proofRequests: ReturnType<typeof deferred<{ uid: string }>>[] = [];
  const reauthenticate = vi.fn(() => {
    const d = deferred<{ uid: string }>();
    proofRequests.push(d);
    return d.promise;
  });
  const cancelReauthentication = vi.fn();
  const hasVerificationReturn = vi.fn(() => false);
  const methods = createSignInMethodsController(
    {
      readSignInMethods: read,
      reauthenticate,
      cancelReauthentication,
      hasVerificationReturn,
    },
    session,
    clock,
  );
  gate.start();
  session.start();
  next({ uid: 'first' });
  await Promise.resolve();
  await Promise.resolve();
  return {
    gate,
    session,
    methods,
    cachedWatch: () => {
      authoritative = false;
    },
    emitContract: (raw: unknown, authoritative: boolean) =>
      emitContract(raw, authoritative),
    read,
    requests,
    proofRequests,
    reauthenticate,
    cancelReauthentication,
    hasVerificationReturn,
    timers,
    next,
    dispose() {
      methods.dispose();
      session.dispose();
      gate.dispose();
    },
  };
}
it('does not read on construction, binds one request to admission and exposes a frozen minimal snapshot', async () => {
  const t = await setup();
  expect(t.read).not.toHaveBeenCalled();
  const opening = t.methods.open();
  void t.methods.open();
  expect(t.read).toHaveBeenCalledExactlyOnceWith('first');
  expect(t.methods.getState().status).toBe('checking');
  t.requests[0]!.resolve({ uid: 'first', providers: ['google', 'google'] });
  await opening;
  expect(t.methods.getState()).toEqual({
    status: 'ready',
    providers: ['google'],
    reason: 'none',
  });
  expect(Object.isFrozen(t.methods.getState().providers)).toBe(true);
  t.dispose();
});
it.each(['logout', 'switch', 'close', 'dispose', 'compatibility'] as const)(
  'discards a late result after %s',
  async (event) => {
    const t = await setup();
    const pending = t.methods.open();
    if (event === 'logout') await t.session.signOut();
    if (event === 'switch') t.next({ uid: 'second' });
    if (event === 'close') t.methods.close();
    if (event === 'dispose') t.methods.dispose();
    if (event === 'compatibility') t.gate.suspend('offline');
    t.requests[0]!.resolve({ uid: 'first', providers: ['google'] });
    await pending;
    expect(t.methods.getState().providers).toEqual([]);
    expect(t.methods.getState().status).not.toBe('ready');
    t.dispose();
  },
);
it('refuses reads while compatibility is closed and requires a fresh explicit retry', async () => {
  const t = await setup();
  t.gate.suspend('offline');
  await t.methods.open();
  expect(t.read).not.toHaveBeenCalled();
  expect(t.methods.getState().reason).toBe('compatibility');
  t.gate.recheck();
  await Promise.resolve();
  await Promise.resolve();
  const pending = t.methods.refresh();
  expect(t.read).toHaveBeenCalledOnce();
  t.requests[0]!.resolve({ uid: 'first', providers: ['microsoft'] });
  await pending;
  expect(t.methods.getState().providers).toEqual(['microsoft']);
  t.dispose();
});
it('never interprets a failed or mismatched read as an unlinked provider', async () => {
  const t = await setup();
  let pending = t.methods.open();
  t.requests[0]!.reject(new SessionError('network'));
  await pending;
  expect(t.methods.getState()).toEqual({
    status: 'unavailable',
    providers: [],
    reason: 'network',
  });
  pending = t.methods.refresh();
  t.requests[1]!.resolve({ uid: 'other', providers: ['google'] });
  await pending;
  expect(t.methods.getState()).toEqual({
    status: 'unavailable',
    providers: [],
    reason: 'verification',
  });
  t.dispose();
});
it('times out without admitting a stale result and allows a fresh lookup', async () => {
  const t = await setup();
  const old = t.methods.open();
  t.timers.at(-1)!.callback();
  expect(t.methods.getState().status).toBe('unavailable');
  const fresh = t.methods.refresh();
  t.requests[0]!.resolve({ uid: 'first', providers: ['google'] });
  await old;
  expect(t.methods.getState().status).toBe('checking');
  t.requests[1]!.resolve({ uid: 'first', providers: ['microsoft'] });
  await fresh;
  expect(t.methods.getState().providers).toEqual(['microsoft']);
  t.dispose();
});

async function openVerifiedStatus() {
  const t = await setup();
  const opening = t.methods.open();
  t.requests[0]!.resolve({ uid: 'first', providers: ['google'] });
  await opening;
  return t;
}
it('allows proof only through a verified linked method and never caches authority to link', async () => {
  const t = await openVerifiedStatus();
  await t.methods.verify('microsoft', 'popup');
  expect(t.reauthenticate).not.toHaveBeenCalled();
  const pending = t.methods.verify('google', 'popup');
  void t.methods.verify('google', 'popup');
  expect(t.reauthenticate).toHaveBeenCalledExactlyOnceWith(
    'first',
    'google',
    'popup',
  );
  t.proofRequests[0]!.resolve({ uid: 'first' });
  await pending;
  expect(t.methods.getState().proof?.status).toBe('verified');
  const again = t.methods.verify('google', 'popup');
  expect(t.reauthenticate).toHaveBeenCalledTimes(2);
  t.proofRequests[1]!.resolve({ uid: 'first' });
  await again;
  t.dispose();
});
it('rejects wrong-account proof without ending the existing authenticated session', async () => {
  const t = await openVerifiedStatus();
  const pending = t.methods.verify('google', 'popup');
  t.proofRequests[0]!.resolve({ uid: 'wrong' });
  await pending;
  expect(t.methods.getState().proof).toMatchObject({
    status: 'error',
    reason: 'wrong-account',
  });
  expect(t.session.getState().identity?.uid).toBe('first');
  t.dispose();
});
it.each([
  'cancel',
  'logout',
  'switch',
  'close',
  'dispose',
  'compatibility',
] as const)('discards late verification after %s', async (event) => {
  const t = await openVerifiedStatus();
  const pending = t.methods.verify('google', 'popup');
  if (event === 'cancel') t.methods.cancelVerification();
  if (event === 'logout') await t.session.signOut();
  if (event === 'switch') t.next({ uid: 'second' });
  if (event === 'close') t.methods.close();
  if (event === 'dispose') t.methods.dispose();
  if (event === 'compatibility') t.gate.suspend('offline');
  expect(t.cancelReauthentication).toHaveBeenCalled();
  t.proofRequests[0]!.resolve({ uid: 'first' });
  await pending;
  expect(t.methods.getState().proof?.status).not.toBe('verified');
  t.dispose();
});
it('keeps a cancelled verification serialized until its SDK promise settles', async () => {
  const t = await openVerifiedStatus();
  const pending = t.methods.verify('google', 'popup');
  t.methods.cancelVerification();
  await t.methods.verify('google', 'popup');
  expect(t.reauthenticate).toHaveBeenCalledOnce();
  expect(t.methods.getState().verificationPending).toBe(true);
  t.proofRequests[0]!.reject(new SessionError('cancelled'));
  await pending;
  expect(t.methods.getState().verificationPending).not.toBe(true);
  expect(t.methods.getState().proof?.reason).toBe('cancelled');
  t.dispose();
});

it.each(['none', 'wrong-account', 'cancelled'] as const)(
  'presents a redirect return only after gated current status reload: %s',
  async (reason) => {
    const t = await setup();
    const pending = t.methods.open();
    t.requests[0]!.resolve({
      uid: 'first',
      providers: ['google'],
      verificationReturn: { provider: 'google', reason },
    });
    await pending;
    expect(t.methods.getState().proof).toMatchObject({
      provider: 'google',
      reason,
      status: reason === 'none' ? 'verified' : 'error',
    });
    t.dispose();
  },
);

it('opens returned verification only after session and compatibility readiness', async () => {
  const t = await setup();
  t.gate.suspend('offline');
  t.hasVerificationReturn.mockReturnValue(true);
  t.next({ uid: 'first' });
  expect(t.read).not.toHaveBeenCalled();
  await t.gate.recheck();
  await vi.waitFor(() => expect(t.read).toHaveBeenCalledOnce());
  expect(t.methods.getState().status).toBe('checking');
  t.requests[0]!.resolve({
    uid: 'first',
    providers: ['google'],
    verificationReturn: { provider: 'google', reason: 'none' },
  });
  await Promise.resolve();
  expect(t.methods.getState().proof?.status).toBe('verified');
  t.dispose();
});

it.each(['before', 'after'] as const)(
  'finishes popup proof after visibility recovery: result %s readiness',
  async (order) => {
    const t = await openVerifiedStatus();
    const pending = t.methods.verify('google', 'popup');
    t.gate.suspend('hidden');
    expect(t.cancelReauthentication).not.toHaveBeenCalled();
    if (order === 'before') {
      t.proofRequests[0]!.resolve({ uid: 'first' });
      await Promise.resolve();
      expect(t.methods.getState().proof?.status).not.toBe('verified');
      expect(t.read).toHaveBeenCalledTimes(1);
    }
    t.gate.recheck('resume');
    if (order === 'after') t.proofRequests[0]!.resolve({ uid: 'first' });
    await vi.waitFor(() => expect(t.read).toHaveBeenCalledTimes(2));
    t.requests[1]!.resolve({ uid: 'first', providers: ['google'] });
    await pending;
    expect(t.methods.getState()).toMatchObject({
      status: 'ready',
      providers: ['google'],
      proof: { status: 'verified' },
    });
    t.dispose();
  },
);
it('automatically recovers provider status after a gate interruption without accepting invalid proof', async () => {
  const t = await openVerifiedStatus();
  const pending = t.methods.verify('google', 'popup');
  t.gate.suspend('offline');
  t.gate.recheck('reconnect');
  expect(t.read).toHaveBeenCalledTimes(1);
  t.proofRequests[0]!.resolve({ uid: 'first' });
  await pending;
  expect(t.read).toHaveBeenCalledTimes(2);
  t.requests[1]!.resolve({ uid: 'first', providers: ['google'] });
  await Promise.resolve();
  expect(t.methods.getState()).toMatchObject({
    status: 'ready',
    providers: ['google'],
  });
  expect(t.methods.getState().proof).toBeUndefined();
  t.dispose();
});
it.each(['logout', 'switch', 'close', 'dispose', 'offline'] as const)(
  'rejects proof awaiting visibility readiness after %s',
  async (event) => {
    const t = await openVerifiedStatus();
    const pending = t.methods.verify('google', 'popup');
    t.gate.suspend('hidden');
    t.proofRequests[0]!.resolve({ uid: 'first' });
    await Promise.resolve();
    await Promise.resolve();
    if (event === 'logout') await t.session.signOut();
    if (event === 'switch') t.next({ uid: 'other' });
    if (event === 'close') t.methods.close();
    if (event === 'dispose') t.methods.dispose();
    if (event === 'offline') t.gate.suspend('offline');
    await pending;
    t.gate.recheck('resume');
    expect(t.methods.getState().proof?.status).not.toBe('verified');
    t.dispose();
  },
);

it('keeps pending identity proof through an unverified cached resume until server readiness', async () => {
  const t = await openVerifiedStatus();
  const pending = t.methods.verify('google', 'popup');
  t.gate.suspend('hidden');
  t.cachedWatch();
  t.gate.recheck('resume');
  expect(t.gate.getState().reason).toBe('server-unverified');
  expect(t.cancelReauthentication).not.toHaveBeenCalled();
  t.proofRequests[0]!.resolve({ uid: 'first' });
  await vi.waitFor(() => expect(t.read).toHaveBeenCalledTimes(2));
  t.requests[1]!.resolve({ uid: 'first', providers: ['google'] });
  await pending;
  expect(t.methods.getState().proof?.status).toBe('verified');
  t.dispose();
});
it('invalidates identity proof if a resumed contract is incompatible', async () => {
  const t = await openVerifiedStatus();
  const pending = t.methods.verify('google', 'popup');
  t.gate.suspend('hidden');
  t.gate.recheck('resume');
  t.emitContract(
    contract({ revision: 2, minAppVersion: '9.0.0', maxAppVersion: '9.0.0' }),
    true,
  );
  expect(t.cancelReauthentication).toHaveBeenCalled();
  t.proofRequests[0]!.resolve({ uid: 'first' });
  await pending;
  expect(t.methods.getState().proof?.status).not.toBe('verified');
  expect(t.session.getState().protectedReady).toBe(false);
  t.dispose();
});

it('caps automatic status recovery instead of creating an Auth/Firestore reload loop', async () => {
  const t = await openVerifiedStatus();
  t.emitContract(contract(), false);
  t.emitContract(contract(), true);
  expect(t.read).toHaveBeenCalledTimes(2);
  t.emitContract(contract(), false);
  t.emitContract(contract(), true);
  expect(t.read).toHaveBeenCalledTimes(2);
  expect(t.methods.getState()).toMatchObject({
    status: 'unavailable',
    reason: 'verification',
  });
  const explicit = t.methods.refresh();
  expect(t.read).toHaveBeenCalledTimes(3);
  t.requests[2]!.resolve({ uid: 'first', providers: ['google'] });
  await explicit;
  expect(t.methods.getState().status).toBe('ready');
  t.dispose();
});
it('ends checking when a compatible contract revision invalidates an in-flight read', async () => {
  const t = await setup();
  const pending = t.methods.open();
  t.emitContract(contract({ revision: 2 }), true);
  t.requests[0]!.resolve({ uid: 'first', providers: ['google'] });
  await pending;
  expect(t.methods.getState()).toMatchObject({
    status: 'unavailable',
    reason: 'verification',
  });
  t.dispose();
});
it('waits for authoritative compatibility after a credential-triggered cache event without visibility changes', async () => {
  const t = await openVerifiedStatus();
  const pending = t.methods.verify('google', 'popup');
  t.emitContract(contract(), false);
  expect(t.cancelReauthentication).not.toHaveBeenCalled();
  t.proofRequests[0]!.resolve({ uid: 'first' });
  await Promise.resolve();
  t.emitContract(contract(), true);
  await vi.waitFor(() => expect(t.read).toHaveBeenCalledTimes(2));
  t.requests[1]!.resolve({ uid: 'first', providers: ['google'] });
  await pending;
  expect(t.methods.getState().proof?.status).toBe('verified');
  t.dispose();
});
