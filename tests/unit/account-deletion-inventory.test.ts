import { expect, it } from 'vitest';
import {
  assertDeletionCollection,
  deletionInventoryFamily,
  validateDeletionInventoryRecord,
} from '../../src/domain/account-deletion-inventory';
import { createWorkspaceSeedPlan } from '../../src/domain/workspace-seeds';
const uid = 'old-account';
const base = `users/${uid}`;
const stamp = { seconds: 100, nanoseconds: 0 };
const meta = {
  schemaVersion: 1,
  recordVersion: 1,
  createdAt: stamp,
  updatedAt: stamp,
};
it.each([
  ['', 'container'],
  ['/profile/main', 'profile'],
  ['/settings/main', 'settings'],
  ['/categories/custom-id', 'category'],
  ['/locations/custom-id', 'location'],
  ['/views/custom-id', 'view'],
  ['/initialization/workspace', 'workspaceInitialization'],
  ['/initializationStages/base', 'initializationStage'],
  ['/nameKeys/categories', 'container'],
  ['/nameKeys/locations', 'container'],
  [`/nameKeys/categories/keys/${'a'.repeat(64)}`, 'nameReservation'],
])('recognizes inventory path %s', (suffix, family) => {
  expect(deletionInventoryFamily(uid, base + suffix)).toBe(family);
});
it.each([
  'users/new-account/profile/main',
  'users/old-account-copy/profile/main',
  `${base}/tasks/task`,
  `${base}/profile/other`,
  `${base}/initializationStages/future`,
  `${base}/categories/one/detail/description`,
  `${base}/nameKeys/views`,
  `${base}/nameKeys/categories/keys/invalid`,
  `${base}/nameKeys/categories/keys/${'A'.repeat(64)}`,
  `${base}/../main`,
  `${base}//main`,
  `accountDeletion/${uid}`,
  `${base}/categories`,
])('blocks unsupported or foreign document %s', (path) => {
  expect(() => deletionInventoryFamily(uid, path)).toThrow(
    'inventory-unsupported',
  );
});
it.each([
  'categories',
  'locations',
  'profile',
  'settings',
  'views',
  'initialization',
  'initializationStages',
  'nameKeys',
])('allows collection %s beneath the exact UID', (kind) => {
  expect(() => assertDeletionCollection(uid, `${base}/${kind}`)).not.toThrow();
});
it('allows nested keys even when its parent snapshot is absent', () => {
  expect(() =>
    assertDeletionCollection(uid, `${base}/nameKeys/categories/keys`),
  ).not.toThrow();
});
it.each([
  `${base}/tasks`,
  `${base}/categories/one/unknown`,
  'users/new-account/categories',
  `${base}/nameKeys/views/keys`,
])('rejects unsupported collection %s', (path) => {
  expect(() => assertDeletionCollection(uid, path)).toThrow(
    'inventory-unsupported',
  );
});
it('validates arbitrary actual classifications rather than only seed IDs', () => {
  const { id, ...seed } = createWorkspaceSeedPlan().categories[0]!;
  expect(
    validateDeletionInventoryRecord(uid, `${base}/categories/${id}`, {
      ...meta,
      ...seed,
    }),
  ).toBe('category');
  expect(
    validateDeletionInventoryRecord(uid, `${base}/categories/custom`, {
      ...meta,
      ...seed,
    }),
  ).toBe('category');
});
it('validates protected defaults through existing record codecs', () => {
  const plan = createWorkspaceSeedPlan();
  for (const [kind, seeds] of [
    ['categories', plan.categories],
    ['locations', plan.locations],
    ['views', plan.views],
  ] as const)
    for (const { id, ...seed } of seeds)
      expect(() =>
        validateDeletionInventoryRecord(uid, `${base}/${kind}/${id}`, {
          ...meta,
          ...seed,
        }),
      ).not.toThrow();
});
it('rejects unsupported schema, extra fields and malformed containers before cleanup', () => {
  for (const data of [
    { schemaVersion: 2 },
    { ...meta, email: 'private@example.invalid' },
  ])
    expect(() =>
      validateDeletionInventoryRecord(uid, `${base}/profile/main`, data),
    ).toThrow('data-invalid');
  expect(validateDeletionInventoryRecord(uid, base, {})).toBe('container');
  expect(() =>
    validateDeletionInventoryRecord(uid, base, { unexpected: true }),
  ).toThrow('data-invalid');
});
