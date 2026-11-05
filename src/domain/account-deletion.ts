import { decodeWorkspaceTimestamp } from './workspace-records';
import type { WorkspaceTimestamp } from './workspace-records';
import { keys, member, object, safeInteger } from './workspace-validation';

export const DELETION_AUTH_WINDOW_SECONDS = 300;
export const DELETION_LEASE_SECONDS = 120;
export const DELETION_BATCH_LIMIT = 100;
export const DELETION_RETIREMENT_SECONDS = 4200;
// Platform gate T7 has not been executed. No elapsed timer enables retirement.
export const DELETION_RETIREMENT_ENABLED = false;
export const DELETION_STATES = [
  'requested',
  'cleaning',
  'data_verified',
  'auth_deleting',
  'awaiting_retirement',
] as const;
export const DELETION_PAUSE_CODES = [
  'inventory-unsupported',
  'data-invalid',
  'project-mismatch',
  'auth-changed',
  'auth-uncertain',
  'verification-failed',
  'permission-denied',
  'unavailable',
  'policy-unsupported',
] as const;
export type DeletionState = (typeof DELETION_STATES)[number];
export type DeletionProvider = 'google.com' | 'microsoft.com';
export interface DeletionAttempt {
  runId: string;
  generation: number;
}
export interface AccountDeletionControl {
  schemaVersion: 1;
  inventoryVersion: 1;
  operatorPolicyVersion: 1;
  admissionRevision: number;
  jobId: string;
  state: DeletionState;
  requestedAt: WorkspaceTimestamp;
  authTime: number;
  proofProvider: DeletionProvider;
  recordVersion: number;
  updatedAt: WorkspaceTimestamp;
  leaseGeneration?: number;
  lease?: DeletionAttempt & { expiresAt: WorkspaceTimestamp };
  authCreatedAt?: WorkspaceTimestamp;
  pauseCode?: (typeof DELETION_PAUSE_CODES)[number];
  dataVerifiedAt?: WorkspaceTimestamp;
  authAttempt?: DeletionAttempt;
  authAbsentObservedAt?: WorkspaceTimestamp;
  retireNotBefore?: WorkspaceTimestamp;
}
export class AccountDeletionDataError extends Error {
  constructor() {
    super('invalid-account-deletion-data');
  }
}
function invalid(): never {
  throw new AccountDeletionDataError();
}
const required = [
  'schemaVersion',
  'inventoryVersion',
  'operatorPolicyVersion',
  'admissionRevision',
  'jobId',
  'state',
  'requestedAt',
  'authTime',
  'proofProvider',
  'recordVersion',
  'updatedAt',
] as const;
const optional = [
  'leaseGeneration',
  'lease',
  'authCreatedAt',
  'pauseCode',
  'dataVerifiedAt',
  'authAttempt',
  'authAbsentObservedAt',
  'retireNotBefore',
] as const;
export function deletionId(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(
      value,
    )
  )
    invalid();
  return value;
}
export function compareDeletionTime(
  a: WorkspaceTimestamp,
  b: WorkspaceTimestamp,
) {
  return a.seconds - b.seconds || a.nanoseconds - b.nanoseconds;
}
export function addDeletionSeconds(
  value: WorkspaceTimestamp,
  seconds: number,
): WorkspaceTimestamp {
  const result = {
    seconds: value.seconds + seconds,
    nanoseconds: value.nanoseconds,
  };
  return decodeWorkspaceTimestamp(result);
}
function positive(value: unknown) {
  const result = safeInteger(value);
  if (result < 1) invalid();
  return result;
}
function attempt(value: unknown, lease = false) {
  const v = object(value);
  keys(v, ['runId', 'generation', ...(lease ? ['expiresAt'] : [])]);
  return { runId: deletionId(v.runId), generation: positive(v.generation) };
}
/** Exact nanosecond admission boundary; no browser clock or email authority. */
export function deletionProofIsRecent(
  authTime: number,
  at: WorkspaceTimestamp,
) {
  if (
    !Number.isSafeInteger(authTime) ||
    authTime < 0 ||
    authTime > Number.MAX_SAFE_INTEGER - DELETION_AUTH_WINDOW_SECONDS
  )
    return false;
  const authenticated = { seconds: authTime, nanoseconds: 0 };
  return (
    compareDeletionTime(authenticated, at) <= 0 &&
    compareDeletionTime(
      at,
      addDeletionSeconds(authenticated, DELETION_AUTH_WINDOW_SECONDS),
    ) <= 0
  );
}
function decode(raw: unknown): AccountDeletionControl {
  const v = object(raw);
  keys(v, required, optional);
  if (
    v.schemaVersion !== 1 ||
    v.inventoryVersion !== 1 ||
    v.operatorPolicyVersion !== 1
  )
    invalid();
  const admissionRevision = positive(v.admissionRevision);
  if (admissionRevision < 3) invalid();
  const result: AccountDeletionControl = {
    schemaVersion: 1,
    inventoryVersion: 1,
    operatorPolicyVersion: 1,
    admissionRevision,
    jobId: deletionId(v.jobId),
    state: member(v.state, DELETION_STATES),
    requestedAt: decodeWorkspaceTimestamp(v.requestedAt),
    authTime: safeInteger(v.authTime),
    proofProvider: member(v.proofProvider, ['google.com', 'microsoft.com']),
    recordVersion: positive(v.recordVersion),
    updatedAt: decodeWorkspaceTimestamp(v.updatedAt),
  };
  if (
    !deletionProofIsRecent(result.authTime, result.requestedAt) ||
    compareDeletionTime(result.updatedAt, result.requestedAt) < 0
  )
    invalid();
  if (Object.hasOwn(v, 'leaseGeneration'))
    result.leaseGeneration = positive(v.leaseGeneration);
  if (Object.hasOwn(v, 'lease')) {
    result.lease = {
      ...attempt(v.lease, true),
      expiresAt: decodeWorkspaceTimestamp(object(v.lease).expiresAt),
    };
    if (result.lease.generation !== result.leaseGeneration) invalid();
  }
  if (Object.hasOwn(v, 'pauseCode'))
    result.pauseCode = member(v.pauseCode, DELETION_PAUSE_CODES);
  for (const field of [
    'authCreatedAt',
    'dataVerifiedAt',
    'authAbsentObservedAt',
    'retireNotBefore',
  ] as const)
    if (Object.hasOwn(v, field))
      result[field] = decodeWorkspaceTimestamp(v[field]);
  if (Object.hasOwn(v, 'authAttempt')) {
    result.authAttempt = attempt(v.authAttempt);
    if (
      !result.leaseGeneration ||
      result.authAttempt.generation > result.leaseGeneration
    )
      invalid();
  }
  const rank = DELETION_STATES.indexOf(result.state);
  if (
    (rank >= 1 && !result.authCreatedAt) ||
    rank >= 2 !== Boolean(result.dataVerifiedAt) ||
    rank >= 3 !== Boolean(result.authAttempt) ||
    rank >= 4 !== Boolean(result.authAbsentObservedAt) ||
    (rank < 4 && result.retireNotBefore)
  )
    invalid();
  if (result.recordVersion === 1) {
    if (
      rank !== 0 ||
      optional.some((field) => Object.hasOwn(v, field)) ||
      compareDeletionTime(result.requestedAt, result.updatedAt) !== 0
    )
      invalid();
  } else if (!result.leaseGeneration) invalid();
  if (
    result.authCreatedAt &&
    compareDeletionTime(result.authCreatedAt, result.requestedAt) > 0
  )
    invalid();
  for (const time of [result.dataVerifiedAt, result.authAbsentObservedAt])
    if (
      time &&
      (compareDeletionTime(time, result.requestedAt) < 0 ||
        compareDeletionTime(time, result.updatedAt) > 0)
    )
      invalid();
  if (
    result.authAbsentObservedAt &&
    result.dataVerifiedAt &&
    compareDeletionTime(result.authAbsentObservedAt, result.dataVerifiedAt) < 0
  )
    invalid();
  if (
    result.retireNotBefore &&
    (!result.authAbsentObservedAt ||
      compareDeletionTime(
        result.retireNotBefore,
        addDeletionSeconds(
          result.authAbsentObservedAt,
          DELETION_RETIREMENT_SECONDS,
        ),
      ) !== 0)
  )
    invalid();
  return result;
}
/** Reject unknown fields/states; callers still fence on existence when decoding fails. */
export function decodeAccountDeletion(raw: unknown): AccountDeletionControl {
  try {
    return decode(raw);
  } catch {
    return invalid();
  }
}
/** Trusted updates cannot rewrite admission, skip stages or move verification anchors. */
export function assertDeletionTransition(
  before: unknown,
  after: unknown,
): AccountDeletionControl {
  const a = decodeAccountDeletion(before),
    b = decodeAccountDeletion(after);
  for (const field of [
    'schemaVersion',
    'inventoryVersion',
    'operatorPolicyVersion',
    'admissionRevision',
    'jobId',
    'authTime',
    'proofProvider',
  ] as const)
    if (a[field] !== b[field]) invalid();
  if (
    compareDeletionTime(a.requestedAt, b.requestedAt) !== 0 ||
    b.recordVersion !== a.recordVersion + 1 ||
    compareDeletionTime(b.updatedAt, a.updatedAt) < 0
  )
    invalid();
  const delta =
    DELETION_STATES.indexOf(b.state) - DELETION_STATES.indexOf(a.state);
  if (delta < 0 || delta > 1 || (b.pauseCode && delta !== 0)) invalid();
  const generation = a.leaseGeneration ?? 0;
  if (
    !b.leaseGeneration ||
    b.leaseGeneration < generation ||
    b.leaseGeneration > generation + 1
  )
    invalid();
  if (
    a.lease &&
    b.lease &&
    a.lease.runId !== b.lease.runId &&
    b.leaseGeneration !== generation + 1
  )
    invalid();
  if (b.lease && !a.lease && b.leaseGeneration !== generation + 1) invalid();
  if (b.leaseGeneration === generation + 1 && !b.lease) invalid();
  if (delta === 1 && !b.lease) invalid();
  for (const field of [
    'authCreatedAt',
    'dataVerifiedAt',
    'authAbsentObservedAt',
    'retireNotBefore',
  ] as const)
    if (
      a[field] &&
      (!b[field] || compareDeletionTime(a[field], b[field]) !== 0)
    )
      invalid();
  if (
    a.authAttempt &&
    (!b.authAttempt ||
      a.authAttempt.runId !== b.authAttempt.runId ||
      a.authAttempt.generation !== b.authAttempt.generation)
  )
    invalid();
  if (
    delta === 1 &&
    b.state === 'auth_deleting' &&
    (!b.lease ||
      b.authAttempt?.runId !== b.lease.runId ||
      b.authAttempt?.generation !== b.lease.generation)
  )
    invalid();
  return b;
}
/** Eligibility is not execution authority. T7 must explicitly change the disabled gate. */
export function deletionRetirementIsDue(
  control: unknown,
  serverTime: WorkspaceTimestamp,
): boolean {
  const c = decodeAccountDeletion(control);
  return (
    c.state === 'awaiting_retirement' &&
    !c.pauseCode &&
    Boolean(c.retireNotBefore) &&
    compareDeletionTime(serverTime, c.retireNotBefore!) >= 0
  );
}
