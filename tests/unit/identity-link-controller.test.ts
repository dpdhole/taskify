import { it, expect, vi } from 'vitest';
import { createIdentityLinkController } from '../../src/application/identity-link-controller';
import {
  createSessionController,
  SessionError,
} from '../../src/application/session-controller';
import { createCompatibilityGate } from '../../src/application/compatibility-gate';
import type {
  LinkReturn,
  SignInMethodsSnapshot,
} from '../../src/application/identity-ports';
import type {
  SessionIdentity,
  SignInProvider,
} from '../../src/application/session-controller';
import { contract, capabilities } from '../support/compatibility-fixtures';
function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (e: unknown) => void;
  const promise = new Promise<T>((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}
async function setup() {
  const timers: { fn: () => void; cancelled: boolean }[] = [];
  const clock = {
    schedule(fn: () => void) {
      const item = { fn, cancelled: false };
      timers.push(item);
      return () => {
        item.cancelled = true;
      };
    },
  };
  let observe!: (value: SessionIdentity | null) => void;
  const gate = createCompatibilityGate(
    {
      readServer: async () => contract(),
      watch(fn) {
        fn(contract(), true);
        return () => {};
      },
    },
    capabilities,
    clock,
  );
  const session = createSessionController(
    {
      initialize: async () => {},
      observe(fn) {
        observe = fn;
        return () => {};
      },
      signOut: async () => {
        observe(null);
      },
      dispose() {},
    },
    gate,
    clock,
    () => {},
  );
  const proofs: ReturnType<
      typeof deferred<{ uid: string; proofId: string }>
    >[] = [],
    submits: ReturnType<typeof deferred<{ uid: string }>>[] = [],
    reads: ReturnType<typeof deferred<SignInMethodsSnapshot>>[] = [];
  const port = {
    readSignInMethods: vi.fn(() => {
      const d = deferred<SignInMethodsSnapshot>();
      reads.push(d);
      return d.promise;
    }),
    proveLink: vi.fn(() => {
      const d = deferred<{ uid: string; proofId: string }>();
      proofs.push(d);
      return d.promise;
    }),
    submitLink: vi.fn(() => {
      const d = deferred<{ uid: string }>();
      submits.push(d);
      return d.promise;
    }),
    cancelLink: vi.fn(),
    takeLinkReturn: vi.fn<() => LinkReturn | undefined>(() => undefined),
  };
  const onSnapshot = vi.fn();
  const link = createIdentityLinkController(port, session, clock, onSnapshot);
  gate.start();
  session.start();
  observe({ uid: 'owner' });
  await Promise.resolve();
  await Promise.resolve();
  return {
    link,
    port,
    proofs,
    submits,
    reads,
    gate,
    session,
    observe,
    timers,
    onSnapshot,
    dispose() {
      link.dispose();
      session.dispose();
      gate.dispose();
    },
  };
}
async function prove(
  t: Awaited<ReturnType<typeof setup>>,
  existing: SignInProvider = 'google',
  target: SignInProvider = 'microsoft',
) {
  t.link.request(target, [existing]);
  const pending = t.link.prove(existing, 'popup', [existing]);
  t.proofs.at(-1)!.resolve({ uid: 'owner', proofId: 'one-use-proof' });
  await vi.waitFor(() => expect(t.reads.length).toBeGreaterThan(0));
  t.reads.at(-1)!.resolve({ uid: 'owner', providers: [existing] });
  await pending;
  expect(t.link.getState().stage).toBe('ready-to-link');
}
it.each([
  ['google', 'microsoft'],
  ['microsoft', 'google'],
] as const)(
  'requires fresh existing %s proof before linking %s and confirms the original UID',
  async (existing, target) => {
    const t = await setup();
    t.link.request(target, [existing]);
    await t.link.submit();
    expect(t.port.submitLink).not.toHaveBeenCalled();
    await prove(t, existing, target);
    expect(t.port.proveLink).toHaveBeenCalledWith(
      'owner',
      target,
      existing,
      'popup',
    );
    expect(t.link.getState()).not.toHaveProperty('proofId');
    const pending = t.link.submit();
    expect(t.port.submitLink).toHaveBeenCalledWith(
      'owner',
      target,
      'one-use-proof',
      'popup',
    );
    t.submits[0]!.resolve({ uid: 'owner' });
    await vi.waitFor(() => expect(t.reads).toHaveLength(2));
    t.reads[1]!.resolve({ uid: 'owner', providers: [existing, target] });
    await pending;
    expect(t.link.getState()).toMatchObject({
      stage: 'linked',
      pending: false,
    });
    expect(t.session.getState().identity?.uid).toBe('owner');
    t.dispose();
  },
);
it('never uses standalone verification or matching email as permission to submit', async () => {
  const t = await setup();
  t.link.request('microsoft', ['google']);
  await t.link.submit();
  expect(t.port.submitLink).not.toHaveBeenCalled();
  t.dispose();
});
it('rejects wrong-account current proof and preserves the original session', async () => {
  const t = await setup();
  t.link.request('microsoft', ['google']);
  const p = t.link.prove('google', 'popup', ['google']);
  t.proofs[0]!.resolve({ uid: 'different', proofId: 'bad' });
  await p;
  expect(t.link.getState()).toMatchObject({
    stage: 'error',
    reason: 'wrong-account',
  });
  expect(t.port.submitLink).not.toHaveBeenCalled();
  expect(t.session.getState().identity?.uid).toBe('owner');
  t.dispose();
});
it.each(['cancel', 'close', 'logout', 'switch', 'offline', 'dispose'] as const)(
  'discards late proof and never submits after %s',
  async (action) => {
    const t = await setup();
    t.link.request('microsoft', ['google']);
    const p = t.link.prove('google', 'popup', ['google']);
    if (action === 'cancel') t.link.cancel();
    if (action === 'close') t.link.close();
    if (action === 'logout') await t.session.signOut();
    if (action === 'switch') t.observe({ uid: 'other' });
    if (action === 'offline') t.gate.suspend('offline');
    if (action === 'dispose') t.link.dispose();
    t.proofs[0]!.resolve({ uid: 'owner', proofId: 'late' });
    await p;
    await t.link.submit();
    expect(t.port.submitLink).not.toHaveBeenCalled();
    expect(t.link.getState().stage).not.toBe('ready-to-link');
    t.dispose();
  },
);
it('keeps a cancelled proof serialized until the underlying SDK call settles', async () => {
  const t = await setup();
  t.link.request('microsoft', ['google']);
  const p = t.link.prove('google', 'popup', ['google']);
  t.link.cancel();
  t.link.request('microsoft', ['google']);
  expect(t.link.getState().pending).toBe(true);
  expect(t.port.proveLink).toHaveBeenCalledOnce();
  t.proofs[0]!.reject(new SessionError('cancelled'));
  await p;
  expect(t.link.getState().pending).toBe(false);
  t.dispose();
});
it('waits for fresh visibility admission and never auto-submits after proof', async () => {
  const t = await setup();
  t.link.request('microsoft', ['google']);
  const p = t.link.prove('google', 'redirect', ['google']);
  t.gate.suspend('hidden');
  t.proofs[0]!.resolve({ uid: 'owner', proofId: 'fresh' });
  await Promise.resolve();
  expect(t.port.readSignInMethods).not.toHaveBeenCalled();
  t.gate.recheck('resume');
  await vi.waitFor(() => expect(t.reads).toHaveLength(1));
  t.reads[0]!.resolve({ uid: 'owner', providers: ['google'] });
  await p;
  expect(t.link.getState().stage).toBe('ready-to-link');
  expect(t.port.submitLink).not.toHaveBeenCalled();
  t.dispose();
});
it('checks compatibility immediately before target-provider submission', async () => {
  const t = await setup();
  await prove(t);
  t.gate.suspend('offline');
  await t.link.submit();
  expect(t.port.submitLink).not.toHaveBeenCalled();
  expect(t.port.cancelLink).toHaveBeenCalled();
  t.dispose();
});
it('does not undo a submitted link when cancellation is requested', async () => {
  const t = await setup();
  await prove(t);
  const p = t.link.submit();
  t.link.cancel();
  expect(t.link.getState().stage).toBe('cancelling');
  t.submits[0]!.resolve({ uid: 'owner' });
  await vi.waitFor(() => expect(t.reads).toHaveLength(2));
  t.reads[1]!.resolve({ uid: 'owner', providers: ['google', 'microsoft'] });
  await p;
  expect(t.link.getState().stage).toBe('linked');
  expect(t.port.submitLink).toHaveBeenCalledOnce();
  t.dispose();
});
it.each([
  'link-conflict',
  'cancelled',
  'popup-blocked',
  'proof-expired',
] as const)(
  'reports current unchanged methods after %s without replay or merge',
  async (reason) => {
    const t = await setup();
    await prove(t);
    const p = t.link.submit();
    t.submits[0]!.reject(new SessionError(reason));
    await vi.waitFor(() => expect(t.reads).toHaveLength(2));
    t.reads[1]!.resolve({ uid: 'owner', providers: ['google'] });
    await p;
    expect(t.link.getState()).toMatchObject({ stage: 'unchanged', reason });
    expect(t.port.submitLink).toHaveBeenCalledOnce();
    t.dispose();
  },
);
it('requires explicit status verification for an uncertain network outcome; it never replays submission', async () => {
  const t = await setup();
  await prove(t);
  const p = t.link.submit();
  t.submits[0]!.reject(new SessionError('network'));
  await vi.waitFor(() => expect(t.reads).toHaveLength(2));
  t.reads[1]!.resolve({ uid: 'owner', providers: ['google'] });
  await p;
  expect(t.link.getState().stage).toBe('uncertain');
  const check = t.link.check();
  await vi.waitFor(() => expect(t.reads).toHaveLength(3));
  t.reads[2]!.resolve({ uid: 'owner', providers: ['google', 'microsoft'] });
  await check;
  expect(t.link.getState().stage).toBe('linked');
  expect(t.port.submitLink).toHaveBeenCalledOnce();
  t.dispose();
});
it('trusts confirmed server membership even when the SDK result was lost', async () => {
  const t = await setup();
  await prove(t);
  const p = t.link.submit();
  t.submits[0]!.reject(new SessionError('network'));
  await vi.waitFor(() => expect(t.reads).toHaveLength(2));
  t.reads[1]!.resolve({ uid: 'owner', providers: ['google', 'microsoft'] });
  await p;
  expect(t.link.getState().stage).toBe('linked');
  t.dispose();
});
it('does not report success solely from the SDK response', async () => {
  const t = await setup();
  await prove(t);
  const p = t.link.submit();
  t.submits[0]!.resolve({ uid: 'owner' });
  await vi.waitFor(() => expect(t.reads).toHaveLength(2));
  t.reads[1]!.resolve({ uid: 'owner', providers: ['google'] });
  await p;
  expect(t.link.getState().stage).toBe('uncertain');
  t.dispose();
});
it('rejects a post-link status response for a different UID', async () => {
  const t = await setup();
  await prove(t);
  const p = t.link.submit();
  t.submits[0]!.resolve({ uid: 'owner' });
  await vi.waitFor(() => expect(t.reads).toHaveLength(2));
  t.reads[1]!.resolve({ uid: 'other', providers: ['google', 'microsoft'] });
  await p;
  expect(t.link.getState().stage).toBe('uncertain');
  expect(t.onSnapshot).toHaveBeenCalledTimes(1);
  t.dispose();
});
it('does not restore submitted-operation UI after account switching', async () => {
  const t = await setup();
  await prove(t);
  const p = t.link.submit();
  t.observe({ uid: 'other' });
  t.submits[0]!.resolve({ uid: 'owner' });
  await p;
  expect(t.link.getState().stage).toBe('idle');
  expect(t.reads).toHaveLength(1);
  t.dispose();
});
it('restores redirect proof only into an explicit Continue step', async () => {
  const t = await setup();
  t.port.takeLinkReturn.mockReturnValueOnce({
    uid: 'owner',
    target: 'microsoft',
    existing: 'google',
    stage: 'ready',
    proofId: 'returned',
    reason: 'none',
  });
  t.observe({ uid: 'owner' });
  await vi.waitFor(() => expect(t.reads).toHaveLength(1));
  t.reads[0]!.resolve({ uid: 'owner', providers: ['google'] });
  await vi.waitFor(() => expect(t.link.getState().stage).toBe('ready-to-link'));
  expect(t.port.submitLink).not.toHaveBeenCalled();
  t.dispose();
});
it('redirect link return only verifies membership and cannot replay proof or link', async () => {
  const t = await setup();
  t.port.takeLinkReturn.mockReturnValueOnce({
    uid: 'owner',
    target: 'microsoft',
    existing: 'google',
    stage: 'checking',
    reason: 'link-uncertain',
  });
  t.observe({ uid: 'owner' });
  await vi.waitFor(() => expect(t.reads).toHaveLength(1));
  t.reads[0]!.resolve({ uid: 'owner', providers: ['google', 'microsoft'] });
  await vi.waitFor(() => expect(t.link.getState().stage).toBe('linked'));
  expect(t.port.proveLink).not.toHaveBeenCalled();
  expect(t.port.submitLink).not.toHaveBeenCalled();
  t.dispose();
});

it('does not claim the chosen identity linked when a conflict coincides with provider membership', async () => {
  const t = await setup();
  await prove(t);
  const p = t.link.submit();
  t.submits[0]!.reject(new SessionError('link-conflict'));
  await vi.waitFor(() => expect(t.reads).toHaveLength(2));
  t.reads[1]!.resolve({ uid: 'owner', providers: ['google', 'microsoft'] });
  await p;
  expect(t.link.getState()).toMatchObject({
    stage: 'error',
    reason: 'link-conflict',
  });
  t.dispose();
});
it('ends an unverified post-submission status read with an uncertain outcome at its deadline', async () => {
  const t = await setup();
  await prove(t);
  const p = t.link.submit();
  t.submits[0]!.resolve({ uid: 'owner' });
  await vi.waitFor(() => expect(t.reads).toHaveLength(2));
  t.timers
    .filter((x) => !x.cancelled)
    .at(-1)!
    .fn();
  await p;
  expect(t.link.getState()).toMatchObject({
    stage: 'uncertain',
    reason: 'network',
    pending: false,
  });
  expect(t.port.submitLink).toHaveBeenCalledOnce();
  t.dispose();
});
it('an explicit check can confirm current absence without replaying a failed link', async () => {
  const t = await setup();
  await prove(t);
  const p = t.link.submit();
  t.submits[0]!.reject(new SessionError('network'));
  await vi.waitFor(() => expect(t.reads).toHaveLength(2));
  t.reads[1]!.reject(new SessionError('network'));
  await p;
  const checking = t.link.check();
  await vi.waitFor(() => expect(t.reads).toHaveLength(3));
  t.reads[2]!.resolve({ uid: 'owner', providers: ['google'] });
  await checking;
  expect(t.link.getState().stage).toBe('unchanged');
  expect(t.port.submitLink).toHaveBeenCalledOnce();
  t.dispose();
});

it('releases a blocked post-submission check as uncertain instead of resubmitting', async () => {
  const t = await setup();
  await prove(t);
  const pending = t.link.submit();
  t.gate.suspend('offline');
  t.submits[0]!.resolve({ uid: 'owner' });
  await vi.waitFor(() => expect(t.link.getState().stage).toBe('checking'));
  t.timers
    .filter((x) => !x.cancelled)
    .at(-1)!
    .fn();
  await pending;
  expect(t.link.getState()).toMatchObject({
    stage: 'uncertain',
    pending: false,
  });
  expect(t.port.submitLink).toHaveBeenCalledOnce();
  t.dispose();
});
