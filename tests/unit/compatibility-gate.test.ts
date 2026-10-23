import { it, expect, vi } from 'vitest';
import { createCompatibilityGate } from '../../src/application/compatibility-gate';
import type {
  ContractReader,
  GateClock,
} from '../../src/application/compatibility-gate';
import { createProtectedConsumers } from '../../src/application/protected-consumers';
import { capabilities, contract } from '../support/compatibility-fixtures';
function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: () => void;
  const promise = new Promise<T>((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}
async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}
function setup() {
  const reads: ReturnType<typeof deferred<unknown>>[] = [];
  const watches: {
    next: (v: unknown, a: boolean) => void;
    error: () => void;
    stopped: boolean;
  }[] = [];
  const deadlines: { fn: () => void; cancelled: boolean }[] = [];
  const reader: ContractReader = {
    readServer() {
      const d = deferred<unknown>();
      reads.push(d);
      return d.promise;
    },
    watch(next, error) {
      const w = { next, error, stopped: false };
      watches.push(w);
      return () => {
        w.stopped = true;
      };
    },
  };
  const clock: GateClock = {
    schedule(fn) {
      const t = { fn, cancelled: false };
      deadlines.push(t);
      return () => {
        t.cancelled = true;
      };
    },
  };
  const gate = createCompatibilityGate(reader, capabilities, clock);
  return { gate, reads, watches, deadlines };
}
it('requires server evidence, revokes cache-only readiness and never fetches per admission', async () => {
  const { gate, reads, watches } = setup();
  gate.start();
  expect(() => gate.admit()).toThrow();
  watches[0]!.next(contract(), false);
  expect(gate.getState().status).not.toBe('ready');
  reads[0]!.resolve(contract());
  await flush();
  expect(gate.getState().status).not.toBe('ready');
  watches[0]!.next(contract(), true);
  const ticket = gate.admit();
  for (let i = 0; i < 10; i++) gate.admit();
  expect(reads).toHaveLength(1);
  expect(gate.isCurrent(ticket)).toBe(true);
  watches[0]!.next(contract(), false);
  expect(gate.isCurrent(ticket)).toBe(false);
  expect(() => gate.submit(ticket, () => 1)).toThrow();
  gate.dispose();
});
it('ignores superseded checks and listener/read races', async () => {
  const { gate, reads, watches } = setup();
  gate.start();
  gate.recheck();
  expect(watches[0]!.stopped).toBe(true);
  reads[0]!.resolve(contract());
  watches[0]!.next(contract(), true);
  await flush();
  expect(gate.getState().status).toBe('checking');
  watches[1]!.next(contract({ revision: 2 }), true);
  reads[1]!.resolve(contract());
  await flush();
  expect(gate.getState().revision).toBe(2);
  expect(gate.getState().status).toBe('ready');
  gate.dispose();
});
it('blocks revision regression/reuse, but an identical authoritative snapshot keeps admission', () => {
  const { gate, watches } = setup();
  gate.start();
  watches[0]!.next(contract({ revision: 2 }), true);
  const ticket = gate.admit();
  watches[0]!.next(contract({ revision: 2 }), true);
  expect(gate.isCurrent(ticket)).toBe(true);
  watches[0]!.next(contract(), true);
  expect(gate.getState().reason).toBe('revision-regression');
  watches[0]!.next(contract({ revision: 3 }), true);
  watches[0]!.next(contract({ revision: 3, serverRelease: 2 }), true);
  expect(gate.getState().reason).toBe('revision-reused');
  gate.dispose();
});
it('handles missing/wrong configuration without poisoning later valid revisions', () => {
  const { gate, watches } = setup();
  gate.start();
  watches[0]!.next(null, true);
  expect(gate.getState().status).toBe('configuration-error');
  watches[0]!.next(contract({ environmentId: 'wrong', revision: 99 }), true);
  expect(gate.getState().reason).toBe('wrong-environment');
  watches[0]!.next(contract(), true);
  expect(gate.getState().status).toBe('ready');
  gate.dispose();
});
it('separates incompatible client, timeout, offline/resume and disposal states', () => {
  const { gate, watches, deadlines } = setup();
  gate.start();
  deadlines[0]!.fn();
  expect(gate.getState().reason).toBe('verification-timeout');
  watches[0]!.next(
    contract({ minAppVersion: '0.2.0', maxAppVersion: '0.2.0' }),
    true,
  );
  expect(gate.getState().reason).toBe('client-too-old');
  gate.suspend('offline');
  expect(watches[0]!.stopped).toBe(true);
  gate.recheck('resume');
  watches[0]!.next(contract(), true);
  expect(gate.getState().status).toBe('checking');
  gate.dispose();
  watches[1]!.next(contract(), true);
  gate.start();
  expect(gate.getState().status).toBe('disposed');
  expect(watches).toHaveLength(2);
});
it('invalidates on listener error and ignores an earlier pending read', async () => {
  const { gate, reads, watches } = setup();
  gate.start();
  watches[0]!.error();
  reads[0]!.resolve(contract());
  await flush();
  expect(gate.getState().status).toBe('verification-unavailable');
  gate.recheck();
  reads[1]!.reject();
  await flush();
  expect(gate.getState().status).toBe('verification-unavailable');
  gate.dispose();
});
it('drops stale workspace loads and preserves submitted outcomes during revocation', async () => {
  const { gate, watches } = setup();
  gate.start();
  watches[0]!.next(contract(), true);
  const load = deferred<string>();
  const submit = deferred<'confirmed'>();
  const publish = vi.fn();
  const port = {
    load: () => load.promise,
    submit: vi.fn(() => submit.promise),
    reconcile: vi.fn(async () => 'confirmed' as const),
  };
  const consumer = createProtectedConsumers(gate, port, publish);
  const loading = consumer.load();
  const command = consumer.submit('op1', 'draft');
  gate.suspend('offline');
  load.resolve('old workspace');
  submit.resolve('confirmed');
  await loading;
  expect(await command).toBe('confirmed');
  expect(publish).not.toHaveBeenCalled();
  expect(gate.getState().status).toBe('verification-unavailable');
  await expect(consumer.submit('op2', 'draft')).rejects.toThrow();
  expect(port.submit).toHaveBeenCalledTimes(1);
  consumer.dispose();
  gate.dispose();
});
it('reconciles unknown acknowledgements before allowing an explicit next command', async () => {
  const { gate, watches } = setup();
  gate.start();
  watches[0]!.next(contract(), true);
  const port = {
    load: async () => '',
    submit: vi.fn(async () => 'unknown' as const),
    reconcile: vi.fn(async () => 'confirmed' as const),
  };
  const c = createProtectedConsumers(gate, port, () => {});
  expect(await c.submit('op', 'draft')).toBe('unknown');
  await expect(c.submit('retry', 'draft')).rejects.toThrow('Reconcile');
  expect(port.submit).toHaveBeenCalledTimes(1);
  expect(await c.reconcile()).toBe('confirmed');
  expect(await c.submit('intentional-next', 'draft')).toBe('unknown');
  c.dispose();
  gate.dispose();
});

it('does not roll back a revision observed in a malformed authoritative policy', () => {
  const { gate, watches } = setup();
  gate.start();
  watches[0]!.next(
    { ...contract({ revision: 10 }), recordFamilies: null },
    true,
  );
  expect(gate.getState().status).toBe('configuration-error');
  watches[0]!.next(contract({ revision: 9 }), true);
  expect(gate.getState().reason).toBe('revision-regression');
  watches[0]!.next(contract({ revision: 11 }), true);
  expect(gate.getState().status).toBe('ready');
  gate.dispose();
});
