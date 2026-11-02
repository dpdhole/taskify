import { it, vi, expect } from 'vitest';
import type { SessionIdentity } from '../../src/application/session-controller';
import type {
  SignInMethodsSnapshot,
  LinkReturn,
} from '../../src/application/identity-ports';
import { createSessionController } from '../../src/application/session-controller';
import { createSignInMethodsController } from '../../src/application/sign-in-methods-controller';
import { createCompatibilityGate } from '../../src/application/compatibility-gate';
import { contract, capabilities } from '../support/compatibility-fixtures';
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
async function setup() {
  let notify!: (v: SessionIdentity | null) => void;
  const clock = {
    schedule() {
      return () => {};
    },
  };
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
        notify = fn;
        return () => {};
      },
      signOut: async () => {
        notify(null);
      },
      dispose() {},
    },
    gate,
    clock,
    () => {},
  );
  const reads: ReturnType<typeof deferred<SignInMethodsSnapshot>>[] = [];
  const proof = deferred<{ uid: string; proofId: string }>(),
    link = deferred<{ uid: string }>();
  const port = {
    readSignInMethods: vi.fn(() => {
      const d = deferred<SignInMethodsSnapshot>();
      reads.push(d);
      return d.promise;
    }),
    reauthenticate: vi.fn(),
    proveLink: vi.fn(() => proof.promise),
    submitLink: vi.fn(() => link.promise),
    cancelLink: vi.fn(),
    takeLinkReturn: vi.fn<() => LinkReturn | undefined>(() => undefined),
  };
  const methods = createSignInMethodsController(port, session, clock);
  gate.start();
  session.start();
  notify({ uid: 'owner' });
  await Promise.resolve();
  await Promise.resolve();
  return {
    methods,
    port,
    reads,
    proof,
    link,
    notify,
    dispose() {
      methods.dispose();
      session.dispose();
      gate.dispose();
    },
  };
}
it('projects linking without proof capabilities, serializes standalone verification and publishes confirmed providers', async () => {
  const t = await setup();
  const opened = t.methods.open();
  t.reads[0]!.resolve({ uid: 'owner', providers: ['microsoft'] });
  await opened;
  t.methods.requestLink('google');
  const proving = t.methods.proveLink('microsoft', 'popup');
  await t.methods.verify('microsoft', 'popup');
  expect(t.port.reauthenticate).not.toHaveBeenCalled();
  t.proof.resolve({ uid: 'owner', proofId: 'private-proof' });
  await vi.waitFor(() => expect(t.reads).toHaveLength(2));
  t.reads[1]!.resolve({ uid: 'owner', providers: ['microsoft'] });
  await proving;
  expect(t.methods.getState().link?.stage).toBe('ready-to-link');
  expect(JSON.stringify(t.methods.getState())).not.toContain('private-proof');
  const linking = t.methods.submitLink();
  expect(t.methods.getState()).toMatchObject({
    status: 'checking',
    providers: [],
  });
  t.link.resolve({ uid: 'owner' });
  await vi.waitFor(() => expect(t.reads).toHaveLength(3));
  t.reads[2]!.resolve({ uid: 'owner', providers: ['google', 'microsoft'] });
  await linking;
  expect(t.methods.getState()).toMatchObject({
    status: 'ready',
    providers: ['google', 'microsoft'],
    link: { stage: 'linked' },
  });
  t.dispose();
});
it('opens methods for a deliberate redirect proof return without starting mutation', async () => {
  const t = await setup();
  t.port.takeLinkReturn.mockReturnValueOnce({
    uid: 'owner',
    existing: 'microsoft',
    target: 'google',
    stage: 'ready',
    proofId: 'returned',
    reason: 'none',
  });
  t.notify({ uid: 'owner' });
  await vi.waitFor(() => expect(t.reads).toHaveLength(1));
  t.reads[0]!.resolve({ uid: 'owner', providers: ['microsoft'] });
  await vi.waitFor(() =>
    expect(t.methods.getState().link?.stage).toBe('ready-to-link'),
  );
  expect(t.methods.getState().status).toBe('ready');
  expect(t.port.submitLink).not.toHaveBeenCalled();
  t.dispose();
});

it('failed redirect proof refreshes status instead of leaving the methods screen checking', async () => {
  const t = await setup();
  t.port.takeLinkReturn.mockReturnValueOnce({
    uid: 'owner',
    existing: 'microsoft',
    target: 'google',
    stage: 'error',
    reason: 'wrong-account',
  });
  t.notify({ uid: 'owner' });
  await vi.waitFor(() => expect(t.reads).toHaveLength(1));
  t.reads[0]!.resolve({ uid: 'owner', providers: ['microsoft'] });
  await vi.waitFor(() =>
    expect(t.methods.getState().link?.stage).toBe('error'),
  );
  expect(t.methods.getState().status).toBe('ready');
  expect(t.port.submitLink).not.toHaveBeenCalled();
  t.dispose();
});

it('clears provider claims when a submitted operation remains uncertain', async () => {
  const t = await setup();
  const open = t.methods.open();
  t.reads[0]!.resolve({ uid: 'owner', providers: ['microsoft'] });
  await open;
  t.methods.requestLink('google');
  const proof = t.methods.proveLink('microsoft', 'popup');
  t.proof.resolve({ uid: 'owner', proofId: 'private' });
  await vi.waitFor(() => expect(t.reads).toHaveLength(2));
  t.reads[1]!.resolve({ uid: 'owner', providers: ['microsoft'] });
  await proof;
  const link = t.methods.submitLink();
  t.link.resolve({ uid: 'unexpected' });
  await vi.waitFor(() => expect(t.reads).toHaveLength(3));
  t.reads[2]!.resolve({ uid: 'owner', providers: ['microsoft'] });
  await link;
  expect(t.methods.getState()).toMatchObject({
    status: 'unavailable',
    providers: [],
    link: { stage: 'uncertain' },
  });
  t.dispose();
});
