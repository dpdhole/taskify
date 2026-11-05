import {
  addDeletionSeconds,
  assertDeletionTransition,
  compareDeletionTime,
  decodeAccountDeletion,
  deletionId,
  DELETION_BATCH_LIMIT,
  DELETION_LEASE_SECONDS,
} from '../../src/domain/account-deletion';
import type { AccountDeletionControl } from '../../src/domain/account-deletion';
import {
  assertDeletionCollection,
  deletionInventoryFamily,
  validateDeletionInventoryRecord,
} from '../../src/domain/account-deletion-inventory';
import type { WorkspaceTimestamp } from '../../src/domain/workspace-records';
import { recordId } from '../../src/domain/workspace-validation';

export interface Target {
  project: string;
  projectNumber: string;
  uid: string;
  jobId: string;
}
export interface Snapshot {
  data: unknown;
  exists: boolean;
  readTime: WorkspaceTimestamp;
}
export interface OperatorTransaction {
  get(path: string): Promise<Snapshot>;
  delete(path: string): void;
  control(
    path: string,
    before: AccountDeletionControl,
    after: AccountDeletionControl,
  ): void;
}
export interface OperatorPort {
  verifyProject(target: Target): Promise<void>;
  get(path: string): Promise<Snapshot>;
  collections(documentPath: string): Promise<string[]>;
  documents(collectionPath: string): Promise<string[]>;
  auth(
    uid: string,
  ): Promise<{ uid: string; createdAt: WorkspaceTimestamp } | null>;
  transaction<T>(work: (tx: OperatorTransaction) => Promise<T>): Promise<T>;
}
export class OperatorError extends Error {
  constructor(
    readonly code:
      | 'invalid-target'
      | 'job-mismatch'
      | 'busy'
      | 'lease-lost'
      | 'auth-changed'
      | 'auth-uncertain'
      | 'reconciliation-required'
      | 'stage-pending'
      | 'retirement-disabled',
  ) {
    super(code);
  }
}
export function validateTarget(t: Target) {
  try {
    recordId(t.uid);
    deletionId(t.jobId);
  } catch {
    throw new OperatorError('invalid-target');
  }
  if (t.project !== 'taskify-dev-dpdhole' || t.projectNumber !== '243252492098')
    throw new OperatorError('invalid-target');
}
export function createDeletionOperator(
  port: OperatorPort,
  target: Target,
  runId: string,
) {
  validateTarget(target);
  deletionId(runId);
  const path = `accountDeletion/${target.uid}`;
  let generation: number | undefined;
  async function control(tx?: OperatorTransaction) {
    const snap = await (tx ?? port).get(path);
    if (!snap.exists) throw new OperatorError('reconciliation-required');
    const c = decodeAccountDeletion(snap.data);
    if (c.jobId !== target.jobId) throw new OperatorError('job-mismatch');
    return { c, now: snap.readTime };
  }
  async function identity(c: AccountDeletionControl) {
    const user = await port.auth(target.uid);
    if (!user) throw new OperatorError('auth-uncertain');
    if (
      user.uid !== target.uid ||
      compareDeletionTime(user.createdAt, c.requestedAt) > 0 ||
      (c.authCreatedAt &&
        compareDeletionTime(user.createdAt, c.authCreatedAt) !== 0)
    )
      throw new OperatorError('auth-changed');
    return user;
  }
  function write(
    tx: OperatorTransaction,
    before: AccountDeletionControl,
    after: AccountDeletionControl,
  ) {
    tx.control(path, before, assertDeletionTransition(before, after));
  }
  function owned(c: AccountDeletionControl, now: WorkspaceTimestamp) {
    if (
      !c.lease ||
      c.lease.runId !== runId ||
      c.lease.generation !== generation ||
      compareDeletionTime(c.lease.expiresAt, now) <= 0
    )
      throw new OperatorError('lease-lost');
  }
  function renewed(
    c: AccountDeletionControl,
    now: WorkspaceTimestamp,
  ): AccountDeletionControl {
    const next = {
      ...c,
      recordVersion: c.recordVersion + 1,
      updatedAt: now,
      lease: {
        runId,
        generation: generation!,
        expiresAt: addDeletionSeconds(now, DELETION_LEASE_SECONDS),
      },
    };
    delete next.pauseCode;
    return next;
  }
  /** Full validation first; no writes, global queries, contents or document IDs in output. */
  async function discover() {
    const paths: string[] = [];
    const counts: Record<string, number> = Object.create(null) as Record<
      string,
      number
    >;
    async function walk(docPath: string): Promise<void> {
      deletionInventoryFamily(target.uid, docPath);
      const snap = await port.get(docPath);
      if (snap.exists) {
        const family = validateDeletionInventoryRecord(
          target.uid,
          docPath,
          snap.data,
        );
        counts[family] = (counts[family] ?? 0) + 1;
      }
      for (const collection of (await port.collections(docPath)).sort()) {
        assertDeletionCollection(target.uid, collection);
        for (const child of (await port.documents(collection)).sort()) {
          // A malicious/broken port cannot escape the enumerated collection.
          if (
            !child.startsWith(collection + '/') ||
            child.split('/').length !== collection.split('/').length + 1
          )
            throw new OperatorError('invalid-target');
          await walk(child);
        }
      }
      if (snap.exists) paths.push(docPath);
    }
    await walk(`users/${target.uid}`);
    return { paths, counts };
  }
  async function acquire() {
    return port.transaction(async (tx) => {
      const { c, now } = await control(tx);
      if (!['requested', 'cleaning', 'data_verified'].includes(c.state))
        throw new OperatorError('stage-pending');
      if (c.lease && compareDeletionTime(c.lease.expiresAt, now) > 0)
        throw new OperatorError('busy');
      const nextGeneration = (c.leaseGeneration ?? 0) + 1;
      const next = {
        ...c,
        recordVersion: c.recordVersion + 1,
        updatedAt: now,
        leaseGeneration: nextGeneration,
        lease: {
          runId,
          generation: nextGeneration,
          expiresAt: addDeletionSeconds(now, DELETION_LEASE_SECONDS),
        },
      };
      write(tx, c, next);
      return nextGeneration;
    });
  }
  async function release() {
    await port.transaction(async (tx) => {
      const { c, now } = await control(tx);
      if (c.lease?.runId !== runId || c.lease.generation !== generation) return;
      const next = { ...c, recordVersion: c.recordVersion + 1, updatedAt: now };
      delete next.lease;
      write(tx, c, next);
    });
  }
  return {
    async inspect() {
      await port.verifyProject(target);
      const { c } = await control();
      // Auth absence is an explicit observation, not a completed-cleanup claim.
      const user = await port.auth(target.uid);
      const inventory = await discover();
      return {
        state: c.state,
        counts: inventory.counts,
        authPresent: Boolean(user),
        authMatches: Boolean(
          user &&
          user.uid === target.uid &&
          compareDeletionTime(user.createdAt, c.requestedAt) <= 0 &&
          (!c.authCreatedAt ||
            compareDeletionTime(user.createdAt, c.authCreatedAt) === 0),
        ),
      };
    },
    async cleanup(command: 'execute' | 'resume', confirmedJob: string) {
      if (confirmedJob !== target.jobId)
        throw new OperatorError('job-mismatch');
      await port.verifyProject(target);
      const { c: initial } = await control();
      if (command === 'execute' && initial.state !== 'requested')
        throw new OperatorError('stage-pending');
      if (!['requested', 'cleaning'].includes(initial.state))
        throw new OperatorError('stage-pending');
      const user = await identity(initial);
      await discover(); // Unknown data blocks before acquiring or deleting anything.
      generation = await acquire();
      try {
        await port.transaction(async (tx) => {
          const { c, now } = await control(tx);
          owned(c, now);
          if (!['requested', 'cleaning'].includes(c.state))
            throw new OperatorError('stage-pending');
          write(tx, c, {
            ...renewed(c, now),
            state: 'cleaning',
            authCreatedAt: user.createdAt,
          });
        });
        for (;;) {
          await identity((await control()).c);
          const inventory = await discover();
          const candidates = inventory.paths.slice(0, DELETION_BATCH_LIMIT);
          if (!candidates.length) break;
          await port.transaction(async (tx) => {
            const { c, now } = await control(tx);
            owned(c, now);
            if (c.state !== 'cleaning')
              throw new OperatorError('stage-pending');
            const snapshots: Snapshot[] = [];
            for (const item of candidates) snapshots.push(await tx.get(item));
            for (let i = 0; i < candidates.length; i++) {
              if (snapshots[i]!.exists)
                validateDeletionInventoryRecord(
                  target.uid,
                  candidates[i]!,
                  snapshots[i]!.data,
                );
            }
            for (let i = 0; i < candidates.length; i++)
              if (snapshots[i]!.exists) tx.delete(candidates[i]!);
            write(tx, c, renewed(c, now));
          });
        }
        // Separate independent traversal before verification marker; no Auth side effects.
        if ((await discover()).paths.length)
          throw new OperatorError('reconciliation-required');
        await identity((await control()).c);
        await port.transaction(async (tx) => {
          const { c, now } = await control(tx);
          owned(c, now);
          if (c.state !== 'cleaning') throw new OperatorError('stage-pending');
          write(tx, c, {
            ...renewed(c, now),
            state: 'data_verified',
            dataVerifiedAt: now,
          });
        });
        return {
          state: 'data_verified',
          authDeletionEnabled: false,
          retirementEnabled: false,
        };
      } finally {
        // Preserve the original error if infrastructure prevents release; expiry is safe.
        await release().catch(() => {});
      }
    },
  };
}
