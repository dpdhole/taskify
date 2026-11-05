import { expect, it } from 'vitest';
import { createDeletionOperator } from '../../tools/account-deletion/operator';
import type {
  OperatorPort,
  Snapshot,
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
function fixture(count = 205) {
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
  let hook: ((deletes: string[]) => void) | undefined;
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
        hook?.(removes);
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
    operator: (runId = run) => createDeletionOperator(port, target, runId),
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
