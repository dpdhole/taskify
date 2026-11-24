import { compareDeletionTime } from '../../src/domain/account-deletion';
import type { AccountDeletionControl } from '../../src/domain/account-deletion';
import type { WorkspaceTimestamp } from '../../src/domain/workspace-records';
import type { Target } from './operator';

// One reviewed disposable job and one capture window. Ordinary cloud retire stays disabled.
export const retirementCanary = {
  target: {
    project: 'taskify-dev-dpdhole',
    projectNumber: '243252492098',
    uid: 'NI96NtWbYzSyepQE9cdP5PnbbEq1',
    jobId: '0c7f0ff6-47b6-4b8d-884f-caffe9da9a0d',
  },
  comparisonUid: '3C5SInr1sYYtjyHNy5Qvh9r8UrZ2',
  authAbsentObservedAt: { seconds: 1795491757, nanoseconds: 697000000 },
  retireNotBefore: { seconds: 1795495957, nanoseconds: 697000000 },
  preRetirementProbe: {
    at: '2026-11-24T04:59:40.598Z',
    tokenExpiry: '2026-11-24T04:28:50.000Z',
    httpStatus: 401,
    status: 'UNAUTHENTICATED',
  },
  captureEndsAt: '2026-11-24T06:28:50.000Z',
  ruleset:
    'projects/taskify-dev-dpdhole/rulesets/564f5136-8a2f-4016-b851-36c1df0707ef',
  rulesSha256:
    '6bea05acb65fd66f39f71964b7e4356d15057fb8b903dad2792cb7bbe6ff8536',
} as const;

export function isRetirementCanary(target: Target) {
  const exact = retirementCanary.target;
  return (
    target.project === exact.project &&
    target.projectNumber === exact.projectNumber &&
    target.uid === exact.uid &&
    target.jobId === exact.jobId
  );
}

export function canaryWindowMatches(
  control: AccountDeletionControl,
  observed: WorkspaceTimestamp,
) {
  const observedMs = observed.seconds * 1000 + observed.nanoseconds / 1000000;
  return (
    control.jobId === retirementCanary.target.jobId &&
    control.state === 'awaiting_retirement' &&
    !control.pauseCode &&
    control.authAbsentObservedAt &&
    control.retireNotBefore &&
    compareDeletionTime(
      control.authAbsentObservedAt,
      retirementCanary.authAbsentObservedAt,
    ) === 0 &&
    compareDeletionTime(
      control.retireNotBefore,
      retirementCanary.retireNotBefore,
    ) === 0 &&
    compareDeletionTime(observed, retirementCanary.retireNotBefore) >= 0 &&
    observedMs >= Date.parse(retirementCanary.preRetirementProbe.at) &&
    // Leave time for the post-retirement probe while the process still holds the capture.
    observedMs < Date.parse(retirementCanary.captureEndsAt) - 120000
  );
}
