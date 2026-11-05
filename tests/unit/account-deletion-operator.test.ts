import { expect, it } from 'vitest';
import { createDeletionOperator } from '../../tools/account-deletion/operator';
import type {
  OperatorPort,
  Snapshot,
  OperatorScheduler,
} from '../../tools/account-deletion/operator';
import { createWorkspaceSeedPlan } from '../../src/domain/workspace-seeds';
import type { AccountDeletionControl } from '../../src/domain/account-deletion';
const target = {
  project: 'taskify-dev-dpdhole',
  projectNumber: '243252492098',
  uid: 'old-account',
  jobId: '11111111-1111-4111-8111-111111111111',
};
const run = '22222222-2222-4222-8222-222222222222';
const otherRun = '33333333-3333-4333-8333-333333333333';
const controlPath = `accountDeletion/${target.uid}`;
const stamp = (seconds: number) => ({ seconds, nanoseconds: 0 });
function fixture(count = 205, clock?: OperatorScheduler) {
  const records = new Map<string, unknown>();
  records.set(controlPath, {
    schemaVersion: 1,
    inventoryVersion: 1,
    operatorPolicyVersion: 1,
    admissionRevision: 3,
    jobId: target.jobId,
    state: 'requested',
    requestedAt: stamp(1000),
    authTime: 900,
    proofProvider: 'google.com',
    recordVersion: 1,
    updatedAt: stamp(1000),
  });
  const { id, ...seed } = createWorkspaceSeedPlan().categories[0]!;
  for (let i = 0; i < count; i++)
    records.set(`users/${target.uid}/categories/${id}-${i}`, {
      schemaVersion: 1,
      recordVersion: 1,
      createdAt: stamp(1000),
      updatedAt: stamp(1000),
      ...seed,
    });
  records.set(
    `users/${target.uid}/nameKeys/categories/keys/${'a'.repeat(64)}`,
    {
      schemaVersion: 1,
      nameKey: 'family',
      entityId: 'family',
      createdAt: stamp(1000),
    },
  );
  records.set('users/new-account/profile/main', { private: 'untouched' });
  let now = 1010,
    deleted = 0,
    verifies = 0;
  let user: { uid: string; createdAt: ReturnType<typeof stamp> } | null = {
    uid: target.uid,
    createdAt: stamp(100),
  };
  let hook:
    ((deletes: string[], next?: AccountDeletionControl) => void) | undefined;
  const batches: number[] = [];
  function snapshot(path: string): Snapshot {
    return {
      exists: records.has(path),
      data: structuredClone(records.get(path)),
      readTime: stamp(now),
    };
  }
  const port: OperatorPort = {
    verifyProject: async () => {
      verifies++;
    },
    get: async (path) => snapshot(path),
    collections: async (path) =>
      [
        ...new Set(
          [...records.keys()]
            .filter((p) => p.startsWith(path + '/'))
            .map((p) =>
              p
                .split('/')
                .slice(0, path.split('/').length + 1)
                .join('/'),
            ),
        ),
      ].sort(),
    documents: async (path) =>
      [
        ...new Set(
          [...records.keys()]
            .filter((p) => p.startsWith(path + '/'))
            .map((p) =>
              p
                .split('/')
                .slice(0, path.split('/').length + 1)
                .join('/'),
            ),
        ),
      ].sort(),
    auth: async () => structuredClone(user),
    deleteAuth: async (_uid, beforeSend) => {
      await beforeSend();
      user = null;
    },
    async transaction(work) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const read = new Map<string, string | undefined>(),
          pending = new Map<string, unknown>(),
          removes: string[] = [];
        const result = await work({
          get: async (path) => {
            read.set(path, JSON.stringify(records.get(path)));
            return snapshot(path);
          },
          delete: (path) => {
            removes.push(path);
          },
          control: (path, _before, after) => {
            pending.set(path, structuredClone(after));
          },
        });
        hook?.(
          removes,
          pending.get(controlPath) as AccountDeletionControl | undefined,
        );
        if (
          [...read].some(
            ([path, value]) => JSON.stringify(records.get(path)) !== value,
          )
        )
          continue;
        for (const path of removes) records.delete(path);
        for (const [path, value] of pending) records.set(path, value);
        if (removes.length) {
          batches.push(removes.length);
          deleted += removes.length;
        }
        now++;
        return result;
      }
      throw Error('contention');
    },
  };
  return {
    records,
    port,
    batches,
    operator: (runId = run) =>
      createDeletionOperator(port, target, runId, clock),
    control: () => records.get(controlPath) as AccountDeletionControl,
    setUser: (value: typeof user) => {
      user = value;
    },
    setNow: (value: number) => {
      now = value;
    },
    hook: (value: typeof hook) => {
      hook = value;
    },
    stats: () => ({ deleted, verifies }),
  };
}
function manualClock() {
  const callbacks = new Set<() => void>();
  return {
    schedule(callback: () => void, milliseconds: number) {
      expect(milliseconds).toBe(30000);
      callbacks.add(callback);
      return () => {
        callbacks.delete(callback);
      };
    },
    fire() {
      const callback = callbacks.values().next().value;
      if (!callback) throw Error('No scheduled renewal');
      callbacks.delete(callback);
      callback();
    },
    pending: () => callbacks.size,
  };
}
const flushRenewal = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
};
it('inspect validates missing-parent descendants without writes or content disclosure', async () => {
  const f = fixture(),
    before = structuredClone([...f.records]);
  const result = await f.operator().inspect();
  expect(result.counts).toEqual({ category: 205, nameReservation: 1 });
  expect(result.authMatches).toBe(true);
  expect([...f.records]).toEqual(before);
  expect(JSON.stringify(result)).not.toContain('family');
});
it('cleans actual non-seed IDs in bounded transactions while preserving Auth, fence and UID B', async () => {
  const f = fixture();
  expect(await f.operator().cleanup('execute', target.jobId)).toEqual({
    state: 'data_verified',
    authDeletionEnabled: false,
    retirementEnabled: false,
  });
  expect(f.batches).toEqual([100, 100, 6]);
  expect(f.stats().deleted).toBe(206);
  expect(f.control().lease).toBeUndefined();
  expect(f.control().state).toBe('data_verified');
  expect((await f.operator().inspect()).authPresent).toBe(true);
  expect(f.records.get('users/new-account/profile/main')).toEqual({
    private: 'untouched',
  });
});
it('rejects unknown inventory before any write', async () => {
  const f = fixture();
  f.records.set(`users/${target.uid}/tasks/task/detail/description`, {
    unknown: true,
  });
  const before = structuredClone([...f.records]);
  await expect(f.operator().cleanup('execute', target.jobId)).rejects.toThrow(
    'inventory-unsupported',
  );
  expect([...f.records]).toEqual(before);
});
it('rejects malformed known records before cleanup', async () => {
  const f = fixture();
  f.records.set(`users/${target.uid}/profile/main`, { schemaVersion: 99 });
  await expect(f.operator().cleanup('execute', target.jobId)).rejects.toThrow(
    'data-invalid',
  );
  expect(f.stats().deleted).toBe(0);
  expect(f.control().state).toBe('requested');
});
it('checks project verification, exact job and confirmation before mutation', async () => {
  const f = fixture();
  await expect(f.operator().cleanup('execute', 'wrong')).rejects.toThrow(
    'job-mismatch',
  );
  expect(f.stats().verifies).toBe(0);
  f.port.verifyProject = async () => {
    throw Error('project-mismatch');
  };
  await expect(f.operator().cleanup('execute', target.jobId)).rejects.toThrow(
    'project-mismatch',
  );
  expect(f.control().recordVersion).toBe(1);
});
it('blocks absent or recreated Auth identity without deleting data', async () => {
  for (const user of [
    null,
    { uid: 'new-account', createdAt: stamp(100) },
    { uid: target.uid, createdAt: stamp(1001) },
  ]) {
    const f = fixture();
    f.setUser(user);
    await expect(f.operator().cleanup('execute', target.jobId)).rejects.toThrow(
      /auth-/,
    );
    expect(f.stats().deleted).toBe(0);
  }
});
it('refuses another live lease but permits expired-lease takeover with a new generation', async () => {
  const f = fixture(1);
  const c = f.control();
  f.records.set(controlPath, {
    ...c,
    recordVersion: 2,
    leaseGeneration: 1,
    lease: { runId: otherRun, generation: 1, expiresAt: stamp(1100) },
  });
  await expect(f.operator().cleanup('execute', target.jobId)).rejects.toThrow(
    'busy',
  );
  f.setNow(1101);
  await f.operator().cleanup('execute', target.jobId);
  expect(f.control().leaseGeneration).toBe(2);
});
it('stale generation cannot commit a delete batch after takeover', async () => {
  const f = fixture();
  f.hook((deletes) => {
    if (!deletes.length) return;
    f.hook(undefined);
    const c = f.control();
    f.records.set(controlPath, {
      ...c,
      recordVersion: c.recordVersion + 1,
      leaseGeneration: 2,
      lease: { runId: otherRun, generation: 2, expiresAt: stamp(1200) },
    });
  });
  await expect(f.operator().cleanup('execute', target.jobId)).rejects.toThrow(
    'lease-lost',
  );
  expect(f.stats().deleted).toBe(0);
  expect(f.control().lease?.runId).toBe(otherRun);
});
it('resumes the same job after interruption without recreating admission or touching another UID', async () => {
  const f = fixture();
  let seen = false;
  f.hook((deletes) => {
    if (deletes.length && seen) {
      f.hook(undefined);
      throw Error('interruption');
    }
    if (deletes.length) seen = true;
  });
  await expect(f.operator().cleanup('execute', target.jobId)).rejects.toThrow(
    'interruption',
  );
  expect(f.stats().deleted).toBe(100);
  expect(f.control().state).toBe('cleaning');
  await f.operator(otherRun).cleanup('resume', target.jobId);
  expect(f.stats().deleted).toBe(206);
  expect(f.control().jobId).toBe(target.jobId);
  expect(f.control().leaseGeneration).toBe(2);
});
it('never replays completed cleanup or clears the fence through execute/resume', async () => {
  const f = fixture(1);
  await f.operator().cleanup('execute', target.jobId);
  const c = structuredClone(f.control());
  await expect(f.operator().cleanup('resume', target.jobId)).rejects.toThrow(
    'stage-pending',
  );
  expect(f.control()).toEqual(c);
});
it('rejects namespace injection from a broken discovery adapter', async () => {
  const f = fixture();
  f.port.documents = async () => ['users/new-account/categories/secret'];
  await expect(f.operator().cleanup('execute', target.jobId)).rejects.toThrow(
    'invalid-target',
  );
  expect(f.stats().deleted).toBe(0);
});

it('persists the Auth latch before its only deletion call and retains the fence', async () => {
  const f = fixture(1),
    engine = f.operator();
  await engine.cleanup('execute', target.jobId);
  let calls = 0;
  f.port.deleteAuth = async (uid) => {
    calls++;
    expect(uid).toBe(target.uid);
    expect(f.control().state).toBe('auth_deleting');
    expect(f.control().authAttempt).toEqual({ runId: run, generation: 2 });
    expect(
      [...f.records.keys()].some((p) => p.startsWith(`users/${target.uid}/`)),
    ).toBe(false);
    f.setUser(null);
  };
  const result = await engine.finalizeAuth(target.jobId);
  expect(calls).toBe(1);
  expect(result).toMatchObject({
    state: 'awaiting_retirement',
    accountRemoved: true,
    controlRetired: false,
    retirementEnabled: false,
  });
  expect(f.control().retireNotBefore!.seconds).toBe(
    f.control().authAbsentObservedAt!.seconds + 4200,
  );
  expect(f.control().lease).toBeUndefined();
  expect(f.records.get('users/new-account/profile/main')).toEqual({
    private: 'untouched',
  });
});
it('reconciles lost Auth acknowledgement without repeating deletion', async () => {
  const f = fixture(0);
  await f.operator().cleanup('execute', target.jobId);
  let calls = 0;
  f.port.deleteAuth = async () => {
    calls++;
    f.setUser(null);
    throw Error('lost-ack');
  };
  await f.operator(otherRun).finalizeAuth(target.jobId);
  expect(calls).toBe(1);
  expect(f.control().state).toBe('awaiting_retirement');
});
it('unknown Auth outcome leaves its latch and requires both explicit recovery attestations', async () => {
  const f = fixture(0);
  await f.operator().cleanup('execute', target.jobId);
  let calls = 0;
  f.port.deleteAuth = async () => {
    calls++;
    throw Error('timeout');
  };
  await expect(f.operator(otherRun).finalizeAuth(target.jobId)).rejects.toThrow(
    'auth-uncertain',
  );
  expect(f.control().state).toBe('auth_deleting');
  const attempt = structuredClone(f.control().authAttempt);
  for (const recovery of [
    {},
    { reconcileAuth: true },
    { priorRunStopped: true },
  ])
    await expect(
      f.operator().finalizeAuth(target.jobId, recovery),
    ).rejects.toThrow('reconciliation-required');
  expect(calls).toBe(1);
  f.setUser(null);
  f.setNow(2000);
  await f
    .operator()
    .finalizeAuth(target.jobId, { reconcileAuth: true, priorRunStopped: true });
  expect(calls).toBe(1);
  expect(f.control().authAttempt).toEqual(attempt);
  expect(f.control().authAbsentObservedAt!.seconds).toBeGreaterThanOrEqual(
    2000,
  );
});
it('an attested Auth retry targets only the pinned existing identity', async () => {
  const f = fixture(0);
  await f.operator().cleanup('execute', target.jobId);
  let calls = 0;
  f.port.deleteAuth = async () => {
    calls++;
    throw Error('timeout');
  };
  await expect(f.operator().finalizeAuth(target.jobId)).rejects.toThrow(
    'auth-uncertain',
  );
  f.port.deleteAuth = async () => {
    calls++;
    f.setUser(null);
  };
  await f
    .operator(otherRun)
    .finalizeAuth(target.jobId, { reconcileAuth: true, priorRunStopped: true });
  expect(calls).toBe(2);
  expect(f.control().state).toBe('awaiting_retirement');
});
it('crash after Auth removal before anchor recording establishes a new conservative anchor', async () => {
  const f = fixture(0);
  await f.operator().cleanup('execute', target.jobId);
  f.hook((_deletes, next) => {
    if (next?.state === 'awaiting_retirement') {
      f.hook(undefined);
      throw Error('crash-before-anchor');
    }
  });
  await expect(f.operator().finalizeAuth(target.jobId)).rejects.toThrow(
    'crash-before-anchor',
  );
  expect(f.control().state).toBe('auth_deleting');
  expect(f.control().authAbsentObservedAt).toBeUndefined();
  expect((await f.operator().inspect()).authPresent).toBe(false);
  f.setNow(2500);
  await f
    .operator(otherRun)
    .finalizeAuth(target.jobId, { reconcileAuth: true, priorRunStopped: true });
  expect(f.control().authAbsentObservedAt!.seconds).toBeGreaterThanOrEqual(
    2500,
  );
  expect(f.control().retireNotBefore!.seconds).toBeGreaterThanOrEqual(6700);
});
it('crash after anchor recording preserves that anchor while repairing a missing deadline', async () => {
  const f = fixture(0);
  await f.operator().cleanup('execute', target.jobId);
  f.hook((_deletes, next) => {
    if (next?.retireNotBefore) {
      f.hook(undefined);
      throw Error('crash-before-deadline');
    }
  });
  await expect(f.operator().finalizeAuth(target.jobId)).rejects.toThrow(
    'crash-before-deadline',
  );
  const anchor = structuredClone(f.control().authAbsentObservedAt!);
  expect(f.control().state).toBe('awaiting_retirement');
  expect(f.control().retireNotBefore).toBeUndefined();
  f.setNow(2500);
  await f.operator(otherRun).finalizeAuth(target.jobId);
  expect(f.control().authAbsentObservedAt).toEqual(anchor);
  expect(f.control().retireNotBefore!.seconds).toBe(anchor.seconds + 4200);
});
it('blocks external Auth absence before the latch and unexpected UID recreation afterward', async () => {
  const f = fixture(0);
  await f.operator().cleanup('execute', target.jobId);
  f.setUser(null);
  await expect(f.operator().finalizeAuth(target.jobId)).rejects.toThrow(
    'auth-uncertain',
  );
  expect(f.control().state).toBe('data_verified');
  f.setUser({ uid: target.uid, createdAt: stamp(100) });
  await f.operator().finalizeAuth(target.jobId);
  f.setUser({ uid: target.uid, createdAt: stamp(2000) });
  await expect(f.operator(otherRun).finalizeAuth(target.jobId)).rejects.toThrow(
    'auth-changed',
  );
  expect(f.control().state).toBe('awaiting_retirement');
});
it('requires empty inventory again before deleting Auth', async () => {
  const f = fixture(0);
  await f.operator().cleanup('execute', target.jobId);
  f.records.set(`users/${target.uid}/profile/main`, {
    schemaVersion: 1,
    recordVersion: 1,
    createdAt: stamp(1000),
    updatedAt: stamp(1000),
  });
  let calls = 0;
  f.port.deleteAuth = async () => {
    calls++;
  };
  await expect(f.operator().finalizeAuth(target.jobId)).rejects.toThrow(
    'reconciliation-required',
  );
  expect(calls).toBe(0);
  expect(f.control().state).toBe('data_verified');
});

it('long owned discovery renews leases using server time without changing generation', async () => {
  const clock = manualClock(),
    f = fixture(3, clock);
  const get = f.port.get;
  let ticks = 0;
  f.port.get = async (path) => {
    if (
      path.startsWith(`users/${target.uid}`) &&
      f.control().state === 'cleaning'
    ) {
      f.setNow(f.control().lease!.expiresAt.seconds - 60);
      clock.fire();
      await flushRenewal();
      ticks++;
    }
    return get(path);
  };
  await f.operator().cleanup('execute', target.jobId);
  expect(ticks).toBeGreaterThan(2);
  expect(f.control().dataVerifiedAt!.seconds).toBeGreaterThan(1200);
  expect(f.control().leaseGeneration).toBe(1);
  expect(f.batches).toEqual([4]);
  expect(clock.pending()).toBe(0);
});
it('inspection and pre-acquisition discovery never start lease-renewal writes', async () => {
  const clock = manualClock(),
    f = fixture(1, clock);
  await f.operator().inspect();
  expect(clock.pending()).toBe(0);
  expect(f.control().recordVersion).toBe(1);
});
it('expired ownership cannot be revived by a late heartbeat', async () => {
  const clock = manualClock(),
    f = fixture(1, clock),
    collections = f.port.collections;
  let checked = false;
  f.port.collections = async (path) => {
    if (!checked && f.control().state === 'cleaning') {
      checked = true;
      f.setNow(f.control().lease!.expiresAt.seconds);
      clock.fire();
      await flushRenewal();
    }
    return collections(path);
  };
  await expect(f.operator().cleanup('execute', target.jobId)).rejects.toThrow(
    'lease-lost',
  );
  expect(f.stats().deleted).toBe(0);
  expect(clock.pending()).toBe(0);
});
it('takeover during discovery blocks stale heartbeat, cleanup and lease release', async () => {
  const clock = manualClock(),
    f = fixture(1, clock),
    collections = f.port.collections;
  let checked = false;
  f.port.collections = async (path) => {
    if (!checked && f.control().state === 'cleaning') {
      checked = true;
      const c = f.control();
      f.records.set(controlPath, {
        ...c,
        recordVersion: c.recordVersion + 1,
        leaseGeneration: 2,
        lease: { runId: otherRun, generation: 2, expiresAt: stamp(2000) },
      });
      clock.fire();
      await flushRenewal();
    }
    return collections(path);
  };
  await expect(f.operator().cleanup('execute', target.jobId)).rejects.toThrow(
    'lease-lost',
  );
  expect(f.stats().deleted).toBe(0);
  expect(f.control().lease?.runId).toBe(otherRun);
  expect(clock.pending()).toBe(0);
});
it('unknown renewal acknowledgement stops mutations and leaves the job resumable', async () => {
  const clock = manualClock(),
    f = fixture(1, clock),
    collections = f.port.collections;
  let checked = false;
  f.port.collections = async (path) => {
    if (!checked && f.control().state === 'cleaning') {
      checked = true;
      f.hook((_deletes, next) => {
        if (next?.lease && next.state === 'cleaning') {
          f.hook(undefined);
          throw Error('renewal-unconfirmed');
        }
      });
      clock.fire();
      await flushRenewal();
    }
    return collections(path);
  };
  await expect(f.operator().cleanup('execute', target.jobId)).rejects.toThrow(
    'renewal-unconfirmed',
  );
  expect(f.stats().deleted).toBe(0);
  expect(f.control().state).toBe('cleaning');
  expect(clock.pending()).toBe(0);
  await f.operator(otherRun).cleanup('resume', target.jobId);
  expect(f.control().state).toBe('data_verified');
});
it('heartbeat during Auth deletion preserves its durable attempt and retirement stays disabled', async () => {
  const clock = manualClock(),
    f = fixture(1, clock),
    engine = f.operator();
  await engine.cleanup('execute', target.jobId);
  let calls = 0;
  f.port.deleteAuth = async (_uid, beforeSend) => {
    calls++;
    const originalAttempt = structuredClone(f.control().authAttempt);
    f.setNow(f.control().lease!.expiresAt.seconds - 60);
    clock.fire();
    await flushRenewal();
    await beforeSend();
    expect(f.control().authAttempt).toEqual(originalAttempt);
    f.setUser(null);
  };
  const result = await engine.finalizeAuth(target.jobId);
  expect(calls).toBe(1);
  expect(result.retirementEnabled).toBe(false);
  expect(f.control().state).toBe('awaiting_retirement');
  expect(clock.pending()).toBe(0);
});

it('renewals never overlap and shutdown waits for the in-flight transaction before release', async () => {
  const clock = manualClock(),
    f = fixture(1, clock),
    collections = f.port.collections;
  const transaction = f.port.transaction;
  let release!: () => void, entered!: () => void;
  const reached = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  let triggered = false;
  f.port.collections = async (path) => {
    if (!triggered && f.control().state === 'cleaning') {
      triggered = true;
      f.port.transaction = async (work) => {
        await blocked;
        return transaction(work);
      };
      clock.fire();
      await flushRenewal();
      expect(clock.pending()).toBe(0);
      expect(() => clock.fire()).toThrow('No scheduled renewal');
      entered();
      throw Error('discovery-unavailable');
    }
    return collections(path);
  };
  let settled = false;
  const work = f
    .operator()
    .cleanup('execute', target.jobId)
    .finally(() => {
      settled = true;
    });
  await reached;
  await flushRenewal();
  expect(settled).toBe(false);
  expect(f.control().lease).toBeDefined();
  release();
  await expect(work).rejects.toThrow('discovery-unavailable');
  expect(f.control().lease).toBeUndefined();
  expect(clock.pending()).toBe(0);
});
it('failed renewal after an Auth call retains the latch and demands explicit reconciliation', async () => {
  const clock = manualClock(),
    f = fixture(1, clock),
    engine = f.operator();
  await engine.cleanup('execute', target.jobId);
  let calls = 0;
  f.port.deleteAuth = async (_uid, beforeSend) => {
    await beforeSend();
    calls++;
    f.setUser(null);
    f.hook((_deletes, next) => {
      if (next?.lease && next.state === 'auth_deleting') {
        f.hook(undefined);
        throw Error('renewal-unknown');
      }
    });
    clock.fire();
    await flushRenewal();
  };
  await expect(engine.finalizeAuth(target.jobId)).rejects.toThrow(
    'renewal-unknown',
  );
  expect(f.control().state).toBe('auth_deleting');
  expect(f.control().authAbsentObservedAt).toBeUndefined();
  expect(clock.pending()).toBe(0);
  await expect(f.operator(otherRun).finalizeAuth(target.jobId)).rejects.toThrow(
    'reconciliation-required',
  );
  await f
    .operator(otherRun)
    .finalizeAuth(target.jobId, { reconcileAuth: true, priorRunStopped: true });
  expect(calls).toBe(1);
  expect(f.control().state).toBe('awaiting_retirement');
});
