import { expect, it } from 'vitest';
import {
  AccountDeletionDataError,
  DELETION_RETIREMENT_ENABLED,
  assertDeletionTransition,
  decodeAccountDeletion,
  deletionProofIsRecent,
  deletionRetirementIsDue,
} from '../../src/domain/account-deletion';
import type { AccountDeletionControl } from '../../src/domain/account-deletion';
const job = '11111111-1111-4111-8111-111111111111';
const run = '22222222-2222-4222-8222-222222222222';
const otherRun = '33333333-3333-4333-8333-333333333333';
const time = (seconds: number, nanoseconds = 0) => ({ seconds, nanoseconds });
function requested(): AccountDeletionControl {
  return {
    schemaVersion: 1,
    inventoryVersion: 1,
    operatorPolicyVersion: 1,
    admissionRevision: 3,
    jobId: job,
    state: 'requested',
    requestedAt: time(1000),
    authTime: 900,
    proofProvider: 'google.com',
    recordVersion: 1,
    updatedAt: time(1000),
  };
}
function stages(): AccountDeletionControl[] {
  const r = requested();
  const c: AccountDeletionControl = {
    ...r,
    recordVersion: 2,
    state: 'cleaning',
    updatedAt: time(1010),
    authCreatedAt: time(100),
    leaseGeneration: 1,
    lease: { runId: run, generation: 1, expiresAt: time(1130) },
  };
  const d: AccountDeletionControl = {
    ...c,
    recordVersion: 3,
    state: 'data_verified',
    dataVerifiedAt: time(1020),
    updatedAt: time(1020),
  };
  const a: AccountDeletionControl = {
    ...d,
    recordVersion: 4,
    state: 'auth_deleting',
    authAttempt: { runId: run, generation: 1 },
    updatedAt: time(1030),
  };
  const f: AccountDeletionControl = {
    ...a,
    recordVersion: 5,
    state: 'awaiting_retirement',
    authAbsentObservedAt: time(1040),
    updatedAt: time(1040),
  };
  return [
    r,
    c,
    d,
    a,
    f,
    {
      ...f,
      recordVersion: 6,
      updatedAt: time(1050),
      retireNotBefore: time(5240),
    },
  ];
}
it('decodes the complete job lifecycle without retaining mutable references', () => {
  const all = stages();
  for (const state of all) {
    expect(decodeAccountDeletion(state)).toEqual(state);
    expect(decodeAccountDeletion(state).requestedAt).not.toBe(
      state.requestedAt,
    );
  }
  for (let i = 1; i < all.length; i++)
    expect(assertDeletionTransition(all[i - 1], all[i])).toEqual(all[i]);
});
it.each(['google.com', 'microsoft.com'])(
  'accepts %s without email or profile fields',
  (proofProvider) => {
    expect(
      decodeAccountDeletion({ ...requested(), proofProvider }).proofProvider,
    ).toBe(proofProvider);
  },
);
it.each([
  [1000, 0, true],
  [1300, 0, true],
  [1300, 1, false],
  [999, 999999999, false],
])('checks exact recent-auth boundary %s:%s', (seconds, nanos, expected) => {
  expect(
    deletionProofIsRecent(1000, time(seconds as number, nanos as number)),
  ).toBe(expected);
});
it.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
  'rejects invalid auth time %s',
  (authTime) => {
    expect(deletionProofIsRecent(authTime, time(1000))).toBe(false);
  },
);
it.each([
  { schemaVersion: 2 },
  { inventoryVersion: 2 },
  { operatorPolicyVersion: 2 },
  { admissionRevision: 2 },
  { admissionRevision: 3.5 },
  { state: 'complete' },
  { proofProvider: 'password' },
  { authTime: 1001 },
  { authTime: 699 },
  { jobId: '11111111-1111-1111-8111-111111111111' },
  { jobId: job.toUpperCase() + ' ' },
  { email: 'private@example.invalid' },
  { recordVersion: 0 },
  { requestedAt: time(1000, 1000000000) },
  { updatedAt: time(999) },
  { requestedAt: { ...time(1000), extra: true } },
  { leaseGeneration: 1 },
  { pauseCode: 'unavailable' },
  { state: 'cleaning' },
])('rejects malformed initial control %j', (patch) => {
  expect(() => decodeAccountDeletion({ ...requested(), ...patch })).toThrow(
    AccountDeletionDataError,
  );
});
it.each(['schemaVersion', 'jobId', 'requestedAt', 'authTime', 'updatedAt'])(
  'rejects missing %s',
  (field) => {
    const value = { ...requested() } as Record<string, unknown>;
    delete value[field];
    expect(() => decodeAccountDeletion(value)).toThrow(
      AccountDeletionDataError,
    );
  },
);
it.each([
  { leaseGeneration: undefined },
  { leaseGeneration: 2 },
  { authCreatedAt: time(1001) },
  { dataVerifiedAt: time(1001) },
  { lease: { runId: run, generation: 1, expiresAt: time(1130), secret: true } },
  { authAttempt: { runId: run, generation: 1 } },
  { pauseCode: 'arbitrary-detail' },
])('rejects invalid trusted control %j', (patch) => {
  expect(() => decodeAccountDeletion({ ...stages()[1], ...patch })).toThrow(
    AccountDeletionDataError,
  );
});
it('rejects early, missing or contradictory completion evidence', () => {
  const final = stages().at(-1)!;
  for (const patch of [
    { dataVerifiedAt: time(1041) },
    { authAbsentObservedAt: time(1019) },
    { retireNotBefore: time(5239) },
    { authAttempt: undefined },
    { authAbsentObservedAt: undefined },
    { updatedAt: time(1039) },
  ])
    expect(() => decodeAccountDeletion({ ...final, ...patch })).toThrow(
      AccountDeletionDataError,
    );
});
it('never grants execution authority just because the retirement deadline elapsed', () => {
  expect(deletionRetirementIsDue(stages().at(-1), time(5239, 999999999))).toBe(
    false,
  );
  expect(deletionRetirementIsDue(stages().at(-1), time(5240))).toBe(true);
  expect(
    deletionRetirementIsDue(
      { ...stages().at(-1), pauseCode: 'unavailable' },
      time(6000),
    ),
  ).toBe(false);
  expect(DELETION_RETIREMENT_ENABLED).toBe(false);
});
it.each([
  { jobId: run },
  { admissionRevision: 4 },
  { authTime: 901 },
  { proofProvider: 'microsoft.com' },
  { recordVersion: 3 },
  { requestedAt: time(1001) },
  { updatedAt: time(999) },
  { state: 'data_verified', dataVerifiedAt: time(1010) },
  { pauseCode: 'unavailable' },
])('rejects admission rewrites and skipped/paused transitions %j', (patch) => {
  expect(() =>
    assertDeletionTransition(requested(), { ...stages()[1], ...patch }),
  ).toThrow(AccountDeletionDataError);
});
it('preserves verification anchors, monotonic state and the original Auth latch', () => {
  const a = stages()[3]!;
  for (const patch of [
    { state: 'cleaning', dataVerifiedAt: undefined, authAttempt: undefined },
    { dataVerifiedAt: time(1021) },
    { authCreatedAt: time(101) },
    { authAttempt: { runId: otherRun, generation: 1 } },
  ])
    expect(() =>
      assertDeletionTransition(a, { ...a, recordVersion: 5, ...patch }),
    ).toThrow(AccountDeletionDataError);
});
it('requires a new generation for a new lease owner', () => {
  const c = stages()[1]!;
  const next = {
    ...c,
    recordVersion: 3,
    lease: { ...c.lease!, runId: otherRun },
  };
  expect(() => assertDeletionTransition(c, next)).toThrow(
    AccountDeletionDataError,
  );
  expect(
    assertDeletionTransition(c, {
      ...next,
      leaseGeneration: 2,
      lease: { ...next.lease, generation: 2 },
    }).leaseGeneration,
  ).toBe(2);
});
