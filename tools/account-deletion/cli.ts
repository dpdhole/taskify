import {
  verifyCanaryCloud,
  snapshotCanaryComparison,
} from './retirement-canary-checks';
import {
  canaryWindowMatches,
  isRetirementCanary,
  retirementCanary,
} from './retirement-canary-plan';
import { decodeAccountDeletion } from '../../src/domain/account-deletion';
import { parseArgs } from 'node:util';
import {
  createDeletionOperator,
  OperatorError,
  validateTarget,
} from './operator';
import { AccountDeletionDataError } from '../../src/domain/account-deletion';
import { DeletionInventoryError } from '../../src/domain/account-deletion-inventory';
import { createFirebaseOperatorPort } from './firebase-port';

// Nothing connects or obtains credentials until arguments/command are validated.
async function main() {
  const args = parseArgs({
    options: {
      project: { type: 'string' },
      'project-number': { type: 'string' },
      uid: { type: 'string' },
      'job-id': { type: 'string' },
      'confirm-job': { type: 'string' },
      emulator: { type: 'boolean', default: false },
      'reconcile-auth': { type: 'boolean', default: false },
      'prior-run-stopped': { type: 'boolean', default: false },
    },
    allowPositionals: true,
    strict: true,
  });
  const command = args.positionals[0];
  if (
    args.positionals.length !== 1 ||
    ![
      'inspect',
      'execute',
      'resume',
      'retire',
      'inspect-canary',
      'retire-canary',
    ].includes(command ?? '')
  )
    throw new OperatorError('invalid-target');
  const values = args.values;
  const target = {
    project: values.project ?? '',
    projectNumber: values['project-number'] ?? '',
    uid: values.uid ?? '',
    jobId: values['job-id'] ?? '',
  };
  validateTarget(target);
  if (
    (values['reconcile-auth'] || values['prior-run-stopped']) &&
    (command !== 'resume' ||
      !values['reconcile-auth'] ||
      !values['prior-run-stopped'])
  )
    throw new OperatorError('invalid-target');
  if (
    !['inspect', 'inspect-canary'].includes(command!) &&
    values['confirm-job'] !== target.jobId
  )
    throw new OperatorError('job-mismatch');
  if (command === 'retire' && !values.emulator)
    throw new OperatorError('retirement-disabled');
  const canary = command === 'inspect-canary' || command === 'retire-canary';
  if (canary && (values.emulator || !isRetirementCanary(target)))
    throw new OperatorError('retirement-disabled');
  const runtime = createFirebaseOperatorPort(target, values.emulator);
  try {
    const operator = createDeletionOperator(
      runtime.port,
      target,
      crypto.randomUUID(),
    );
    if (canary) {
      const cloud = await verifyCanaryCloud(runtime.port);
      const inspection = await operator.inspect();
      const snapshot = await runtime.port.get(`accountDeletion/${target.uid}`);
      const control = decodeAccountDeletion(snapshot.data);
      if (
        !canaryWindowMatches(control, snapshot.readTime) ||
        inspection.authPresent ||
        Object.keys(inspection.counts).length
      )
        throw new OperatorError('reconciliation-required');
      const comparisonBefore = await snapshotCanaryComparison(runtime.port);
      const preflight = {
        target,
        cloud,
        inspection,
        serverReadTime: snapshot.readTime,
        authAbsentObservedAt: control.authAbsentObservedAt,
        retireNotBefore: control.retireNotBefore,
        captureEndsAt: retirementCanary.captureEndsAt,
        preRetirementProbe: retirementCanary.preRetirementProbe,
        comparisonBefore,
      };
      if (command === 'inspect-canary') {
        process.stdout.write(
          JSON.stringify({ ...preflight, readOnly: true }) + '\n',
        );
        return;
      }
      const result = await operator.retire(values['confirm-job']!, 'canary');
      // Report the mutation even if the independent comparison cannot be read back.
      const comparisonAfter = await snapshotCanaryComparison(
        runtime.port,
      ).catch(() => null);
      process.stdout.write(
        JSON.stringify({
          ...preflight,
          ...result,
          comparisonAfter,
          comparisonUnchanged: comparisonAfter
            ? JSON.stringify(comparisonBefore) ===
              JSON.stringify(comparisonAfter)
            : null,
        }) + '\n',
      );
      return;
    }
    if (command === 'retire') {
      const result = await operator.retire(values['confirm-job']!);
      process.stdout.write(JSON.stringify(result) + '\n');
      return;
    }
    const inspected = await operator.inspect();
    let result: unknown = inspected;
    if (command !== 'inspect') {
      if (command === 'execute' && inspected.state !== 'requested')
        throw new OperatorError('stage-pending');
      if (['requested', 'cleaning'].includes(inspected.state))
        await operator.cleanup(
          command as 'execute' | 'resume',
          values['confirm-job']!,
        );
      result = await operator.finalizeAuth(values['confirm-job']!, {
        reconcileAuth: values['reconcile-auth'],
        priorRunStopped: values['prior-run-stopped'],
      });
    }
    process.stdout.write(JSON.stringify(result) + '\n');
  } finally {
    await runtime.close();
  }
}
try {
  await main();
} catch (error) {
  // SDK errors can contain paths, request bodies and credential details. Never print them.
  const code =
    error instanceof OperatorError
      ? error.code
      : error instanceof AccountDeletionDataError
        ? 'policy-unsupported'
        : error instanceof DeletionInventoryError
          ? error.reason
          : error &&
              typeof error === 'object' &&
              'code' in error &&
              typeof error.code === 'string' &&
              error.code.startsWith('ERR_PARSE_ARGS')
            ? 'invalid-target'
            : 'validation-or-infrastructure-failure';
  process.stderr.write(
    JSON.stringify({
      status: 'blocked',
      code,
      ...(error instanceof OperatorError && error.diagnostic
        ? { diagnostic: error.diagnostic }
        : {}),
    }) + '\n',
  );
  process.exitCode =
    code === 'busy' ||
    code === 'stage-pending' ||
    code === 'retirement-disabled'
      ? 3
      : code === 'reconciliation-required' ||
          code === 'control-absent' ||
          code === 'auth-uncertain' ||
          code === 'auth-changed' ||
          code === 'data-invalid'
        ? 4
        : code === 'invalid-target' ||
            code === 'job-mismatch' ||
            code === 'inventory-unsupported' ||
            code === 'policy-unsupported'
          ? 2
          : 5;
}
