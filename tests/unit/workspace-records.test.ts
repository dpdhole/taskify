import { expect, it } from 'vitest';
import {
  decodeWorkspaceRecord,
  decodeWorkspaceTimestamp,
} from '../../src/domain/workspace-records';
import { createWorkspaceSeedPlan } from '../../src/domain/workspace-seeds';
const stamp = { seconds: 100, nanoseconds: 123456789 };
const meta = {
  schemaVersion: 1,
  recordVersion: 1,
  createdAt: stamp,
  updatedAt: stamp,
};
function named() {
  const { id, ...data } = createWorkspaceSeedPlan().categories[0]!;
  return { id, data: { ...meta, ...data } };
}
it('preserves timestamp precision without importing Firebase or rounding to milliseconds', () => {
  expect(decodeWorkspaceTimestamp(stamp)).toEqual(stamp);
  expect(decodeWorkspaceTimestamp(stamp)).not.toBe(stamp);
});
it.each([-1, 1000000000, 0.5, NaN])(
  'rejects invalid nanoseconds %s',
  (nanoseconds) => {
    expect(() => decodeWorkspaceTimestamp({ ...stamp, nanoseconds })).toThrow();
  },
);
it('decodes every exact classification and View seed as a normalized persisted record', () => {
  const plan = createWorkspaceSeedPlan();
  for (const [family, seeds] of [
    ['category', plan.categories],
    ['location', plan.locations],
    ['view', plan.views],
  ] as const) {
    for (const { id, ...seed } of seeds)
      expect(decodeWorkspaceRecord(family, id, { ...meta, ...seed })).toEqual({
        ...meta,
        ...seed,
      });
  }
});
it.each([
  { schemaVersion: 2 },
  { recordVersion: 0 },
  { extra: true },
  { nameKey: 'forged' },
  { order: 1.5 },
  { icon: '<svg>' },
])('blocks malformed/unsupported classification %j', (change) => {
  const v = named();
  expect(() =>
    decodeWorkspaceRecord('category', v.id, { ...v.data, ...change }),
  ).toThrow();
});
it('rejects non-normalized names even if the literal key is lowercased', () => {
  const v = named();
  expect(() =>
    decodeWorkspaceRecord('category', v.id, {
      ...v.data,
      name: 'Cafe\u0301',
      nameKey: 'cafe\u0301',
    }),
  ).toThrow();
});
it('protects Uncategorized but permits order changes without changing its definition', () => {
  const { id, ...data } = createWorkspaceSeedPlan().categories.at(-1)!;
  expect(
    decodeWorkspaceRecord('category', id, { ...meta, ...data, order: 500 }),
  ).toMatchObject({ order: 500 });
  expect(() =>
    decodeWorkspaceRecord('category', id, { ...meta, ...data, archived: true }),
  ).toThrow('protected-category');
  expect(() =>
    decodeWorkspaceRecord('category', 'fake', { ...meta, ...data }),
  ).toThrow('protected-category');
});
it('protects All Tasks definition and Home inclusion while allowing its order to move', () => {
  const { id, ...data } = createWorkspaceSeedPlan().views.at(-1)!;
  expect(
    decodeWorkspaceRecord('view', id, { ...meta, ...data, order: 500 }),
  ).toMatchObject({ order: 500 });
  expect(() =>
    decodeWorkspaceRecord('view', id, { ...meta, ...data, showOnHome: false }),
  ).toThrow('protected-view');
  expect(() =>
    decodeWorkspaceRecord('view', id, {
      ...meta,
      ...data,
      query: { ...data.query, includeClosed: true },
    }),
  ).toThrow('protected-view');
});
it('distinguishes initializing from complete with required valid completion evidence shape', () => {
  const v = { ...meta, templateVersion: 1, status: 'initializing' };
  expect(
    decodeWorkspaceRecord('workspaceInitialization', 'workspace', v),
  ).toEqual(v);
  expect(() =>
    decodeWorkspaceRecord('workspaceInitialization', 'workspace', {
      ...v,
      completedAt: stamp,
    }),
  ).toThrow();
  expect(() =>
    decodeWorkspaceRecord('workspaceInitialization', 'workspace', {
      ...v,
      status: 'complete',
    }),
  ).toThrow();
  expect(
    decodeWorkspaceRecord('workspaceInitialization', 'workspace', {
      ...v,
      status: 'complete',
      completedAt: stamp,
    }),
  ).toMatchObject({ status: 'complete' });
});
it('validates immutable receipt/reservation shapes without edit counters', () => {
  const receipt = { schemaVersion: 1, templateVersion: 1, completedAt: stamp };
  expect(decodeWorkspaceRecord('initializationStage', 'base', receipt)).toEqual(
    receipt,
  );
  expect(() =>
    decodeWorkspaceRecord('initializationStage', 'base', {
      ...receipt,
      recordVersion: 1,
    }),
  ).toThrow();
  const reservation = {
    schemaVersion: 1,
    nameKey: 'family',
    entityId: 'family',
    createdAt: stamp,
  };
  expect(
    decodeWorkspaceRecord('nameReservation', 'a'.repeat(64), reservation),
  ).toEqual(reservation);
  expect(() =>
    decodeWorkspaceRecord('nameReservation', 'family', reservation),
  ).toThrow();
});
it('accepts absent social fields and explicit settings, rejects null/non-HTTPS profile fields', () => {
  expect(decodeWorkspaceRecord('profile', 'main', meta)).toEqual(meta);
  expect(
    decodeWorkspaceRecord('profile', 'main', {
      ...meta,
      photoUrl: 'https://example.invalid/photo',
    }),
  ).toMatchObject({ photoUrl: 'https://example.invalid/photo' });
  expect(() =>
    decodeWorkspaceRecord('profile', 'main', { ...meta, displayName: null }),
  ).toThrow();
  expect(() =>
    decodeWorkspaceRecord('profile', 'main', {
      ...meta,
      photoUrl: 'http://example.invalid',
    }),
  ).toThrow();
  expect(
    decodeWorkspaceRecord('settings', 'main', {
      ...meta,
      timezone: 'Asia/Kolkata',
    }),
  ).toMatchObject({ timezone: 'Asia/Kolkata' });
  expect(() =>
    decodeWorkspaceRecord('settings', 'main', {
      ...meta,
      timezone: 'Not/AZone',
    }),
  ).toThrow();
});
it('rejects timestamp reversal and synthetic Location documents', () => {
  const v = named();
  expect(() =>
    decodeWorkspaceRecord('category', v.id, {
      ...v.data,
      updatedAt: { seconds: 99, nanoseconds: 0 },
    }),
  ).toThrow();
  expect(() =>
    decodeWorkspaceRecord('location', 'unspecified', v.data),
  ).toThrow('synthetic-location');
});
