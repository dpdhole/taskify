import { expect, it } from 'vitest';
import type { AccountDeletionControl } from '../../src/domain/account-deletion';
import {
  canaryWindowMatches,
  isRetirementCanary,
  retirementCanary,
} from '../../tools/account-deletion/retirement-canary-plan';

const stamp = (iso: string) => {
  const ms = Date.parse(iso);
  return {
    seconds: Math.floor(ms / 1000),
    nanoseconds: (ms % 1000) * 1_000_000,
  };
};
const control: AccountDeletionControl = {
  schemaVersion: 1,
  inventoryVersion: 1,
  operatorPolicyVersion: 1,
  admissionRevision: 3,
  jobId: retirementCanary.target.jobId,
  state: 'awaiting_retirement',
  requestedAt: stamp('2026-11-08T03:51:00Z'),
  authTime: Math.floor(Date.parse('2026-11-08T03:50:00Z') / 1000),
  proofProvider: 'google.com',
  recordVersion: 12,
  updatedAt: retirementCanary.authAbsentObservedAt,
  leaseGeneration: 2,
  authCreatedAt: stamp('2026-11-08T03:49:00Z'),
  dataVerifiedAt: stamp('2026-11-08T03:56:40Z'),
  authAttempt: { runId: '11111111-1111-4111-8111-111111111111', generation: 2 },
  authAbsentObservedAt: retirementCanary.authAbsentObservedAt,
  retireNotBefore: retirementCanary.retireNotBefore,
};

it('pins the canary to the reviewed project, UID and job', () => {
  const target = retirementCanary.target;
  expect(isRetirementCanary(target)).toBe(true);
  expect(
    isRetirementCanary({ ...target, uid: retirementCanary.comparisonUid }),
  ).toBe(false);
  expect(
    isRetirementCanary({
      ...target,
      jobId: '11111111-1111-4111-8111-111111111111',
    }),
  ).toBe(false);
  expect(isRetirementCanary({ ...target, projectNumber: '1' })).toBe(false);
});

it('rejects early, changed-anchor and too-late canaries', () => {
  const observed = stamp('2026-11-24T05:10:00Z');
  expect(canaryWindowMatches(control, observed)).toBe(true);
  expect(canaryWindowMatches(control, stamp('2026-11-24T04:59:40Z'))).toBe(
    false,
  );
  expect(canaryWindowMatches(control, stamp('2026-11-24T06:26:50Z'))).toBe(
    false,
  );
  expect(
    canaryWindowMatches(
      { ...control, authAbsentObservedAt: stamp('2026-11-08T03:56:45Z') },
      observed,
    ),
  ).toBe(false);
  expect(
    canaryWindowMatches(
      { ...control, pauseCode: 'verification-failed' },
      observed,
    ),
  ).toBe(false);
});
