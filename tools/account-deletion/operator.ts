import {
  addDeletionSeconds,
  assertDeletionTransition,
  compareDeletionTime,
  decodeAccountDeletion,
  deletionId,
  DELETION_BATCH_LIMIT,
  DELETION_LEASE_SECONDS,
  DELETION_RETIREMENT_SECONDS,
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
  /** One bounded external call, no retry. A failure does not establish its outcome. */
  deleteAuth(uid: string, beforeSend: () => Promise<void>): Promise<void>;
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
  async function acquire(authRecovery = false, finalization = false) {
    return port.transaction(async (tx) => {
      const { c, now } = await control(tx);
      if (c.state === 'auth_deleting' && !authRecovery)
        throw new OperatorError('reconciliation-required');
      if (
        !(
          finalization
            ? ['data_verified', 'auth_deleting', 'awaiting_retirement']
            : ['requested', 'cleaning', 'data_verified']
        ).includes(c.state)
      )
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
    async finalizeAuth(
      confirmedJob: string,
      recovery: { reconcileAuth?: boolean; priorRunStopped?: boolean } = {},
    ) {
      if (confirmedJob !== target.jobId)
        throw new OperatorError('job-mismatch');
      await port.verifyProject(target);
      const { c: initial } = await control();
      if (
        !['data_verified', 'auth_deleting', 'awaiting_retirement'].includes(
          initial.state,
        )
      )
        throw new OperatorError('stage-pending');
      const attested =
        recovery.reconcileAuth === true && recovery.priorRunStopped === true;
      if (initial.state === 'auth_deleting' && !attested)
        throw new OperatorError('reconciliation-required');
      if ((await discover()).paths.length)
        throw new OperatorError('reconciliation-required');
      if (initial.state === 'data_verified') await identity(initial);
      if (
        initial.state === 'awaiting_retirement' &&
        (await port.auth(target.uid))
      )
        throw new OperatorError('auth-changed');
      generation = await acquire(attested, true);
      try {
        const { c: acquired } = await control();
        if (acquired.state === 'data_verified') {
          await identity(acquired);
          await port.transaction(async (tx) => {
            const { c, now } = await control(tx);
            owned(c, now);
            if (c.state !== 'data_verified')
              throw new OperatorError('stage-pending');
            write(tx, c, {
              ...renewed(c, now),
              state: 'auth_deleting',
              authAttempt: { runId, generation: generation! },
            });
          });
        }
        const { c: latched, now } = await control();
        owned(latched, now);
        if (latched.state === 'auth_deleting') {
          const user = await port.auth(target.uid);
          if (user) {
            if (
              !latched.authCreatedAt ||
              user.uid !== target.uid ||
              compareDeletionTime(user.createdAt, latched.authCreatedAt) !== 0
            )
              throw new OperatorError('auth-changed');
            // Recheck ownership immediately before the non-transactional operation.
            const latest = await control();
            owned(latest.c, latest.now);
            if (latest.c.state !== 'auth_deleting')
              throw new OperatorError('stage-pending');
            try {
              await port.deleteAuth(target.uid, async () => {
                const current = await control();
                owned(current.c, current.now);
                if (current.c.state !== 'auth_deleting')
                  throw new OperatorError('stage-pending');
              });
            } catch {
              /* Query authoritative outcome, never blind-retry. */
            }
          }
          if (await port.auth(target.uid))
            throw new OperatorError('auth-uncertain');
          if ((await discover()).paths.length)
            throw new OperatorError('reconciliation-required');
          await port.transaction(async (tx) => {
            const { c, now: observed } = await control(tx);
            owned(c, observed);
            if (c.state !== 'auth_deleting')
              throw new OperatorError('stage-pending');
            write(tx, c, {
              ...renewed(c, observed),
              state: 'awaiting_retirement',
              authAbsentObservedAt: observed,
            });
          });
        }
        // Use the resolved server anchor, including after an interrupted marker write.
        await port.transaction(async (tx) => {
          const { c, now: verified } = await control(tx);
          owned(c, verified);
          if (c.state !== 'awaiting_retirement' || !c.authAbsentObservedAt)
            throw new OperatorError('stage-pending');
          if (!c.retireNotBefore)
            write(tx, c, {
              ...renewed(c, verified),
              retireNotBefore: addDeletionSeconds(
                c.authAbsentObservedAt,
                DELETION_RETIREMENT_SECONDS,
              ),
            });
        });
        const { c: result } = await control();
        return {
          state: result.state,
          accountRemoved: true,
          controlRetired: false,
          retirementEnabled: false,
          retireNotBefore: result.retireNotBefore,
        };
      } finally {
        await release().catch(() => {});
      }
    },
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
