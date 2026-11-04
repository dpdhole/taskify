import { expect, it } from 'vitest';
import {
  decodeContract,
  evaluateCompatibility,
} from '../../src/domain/compatibility';
import type { ClientCapabilities } from '../../src/domain/compatibility';
import { capabilities, contract } from '../support/compatibility-fixtures';
// Synthetic policy candidate only: 0.2.0 is not an approved release assignment.
const names = [
  'workspaceInitialization',
  'profile',
  'settings',
  'category',
  'location',
  'view',
  'initializationStage',
  'nameReservation',
  'accountDeletion',
];
function client(): ClientCapabilities {
  return {
    ...capabilities,
    appVersion: '0.2.0',
    families: {
      ...capabilities.families,
      ...Object.fromEntries(
        names.map((name) => [
          name,
          {
            readableSchemas: [1],
            ...(name === 'accountDeletion' ? {} : { writeSchema: 1 }),
          },
        ]),
      ),
    },
  };
}
function policy() {
  return contract({
    minAppVersion: '0.2.0',
    maxAppVersion: '0.2.0',
    recordFamilies: {
      ...contract().recordFamilies,
      ...Object.fromEntries(
        names.map((name) => [
          name,
          {
            presentSchemaVersions: [1],
            allowedWriteSchemaVersions: [1],
          },
        ]),
      ),
    },
  });
}
it('admits the candidate nine-family client with read-only deletion capability', () => {
  expect(evaluateCompatibility(decodeContract(policy()), client())).toBeNull();
  expect(client().families.accountDeletion?.writeSchema).toBeUndefined();
});
it('blocks candidate provisioning against the old published family map', () => {
  const old = contract({ maxAppVersion: '0.2.0' });
  expect(() => evaluateCompatibility(decodeContract(old), client())).toThrow(
    'missing-family',
  );
});
it('blocks the old client when the candidate minimum release is raised', () => {
  expect(evaluateCompatibility(decodeContract(policy()), capabilities)).toBe(
    'client-too-old',
  );
});
it('demonstrates that adding policy families alone does not retire the old client', () => {
  const expanded = { ...policy(), minAppVersion: '0.1.0' };
  expect(
    evaluateCompatibility(decodeContract(expanded), capabilities),
  ).toBeNull();
});
it('blocks unknown retained fence schema even though the client never writes the fence', () => {
  const changed = policy();
  changed.recordFamilies.accountDeletion!.presentSchemaVersions = [1, 2];
  expect(evaluateCompatibility(decodeContract(changed), client())).toBe(
    'unreadable-data',
  );
});
it('blocks a prohibited workspace write schema', () => {
  const changed = policy();
  changed.recordFamilies.category!.presentSchemaVersions = [1, 2];
  changed.recordFamilies.category!.allowedWriteSchemaVersions = [2];
  const c = client();
  const category = c.families.category!;
  const withReader = {
    ...c,
    families: {
      ...c.families,
      category: { ...category, readableSchemas: [1, 2] },
    },
  };
  expect(evaluateCompatibility(decodeContract(changed), withReader)).toBe(
    'writer-prohibited',
  );
});
it('a missing authoritative contract cannot silently supply new-family support', () => {
  expect(() => decodeContract(null)).toThrow('malformed-contract');
});
