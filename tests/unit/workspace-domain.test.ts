import { expect, it } from 'vitest';
import { decodeWorkspaceQuery } from '../../src/domain/workspace-query';
import {
  createWorkspaceSeedPlan,
  normalizeClassificationName,
  validateWorkspaceTimezone,
} from '../../src/domain/workspace-seeds';
const base = () => createWorkspaceSeedPlan().views[0]!.query;
it('creates exactly the approved catalogues and numeric ranks, with no synthetic Location record', () => {
  const plan = createWorkspaceSeedPlan();
  expect(plan.categories.map((c) => c.name)).toEqual([
    'Family',
    'Finance',
    'Friends',
    'Growth',
    'Hobbies',
    'Household',
    'Leisure',
    'Self',
    'Social',
    'Wellness',
    'Work',
    'Uncategorized',
  ]);
  expect(plan.locations.map((c) => c.name)).toEqual([
    'Grocery',
    'Gym',
    'Local Stores',
    'Mall',
    'Market',
    'Office',
    'Online',
    'Pharmacy',
    'Residence',
    'School',
  ]);
  for (const rows of [plan.categories, plan.locations, plan.views]) {
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    expect(rows.map((r) => r.order)).toEqual(
      rows.map((_r, i) => (i + 1) * 1000),
    );
  }
  expect(
    plan.locations.some((l) => l.id === 'unassigned' || l.id === 'unspecified'),
  ).toBe(false);
});
it('encodes eligibility as explicit queries, not preset labels or invented Scheduled date restrictions', () => {
  const views = createWorkspaceSeedPlan().views;
  expect(
    views.map((v) => [
      v.id,
      v.query.groupBy,
      v.query.sort.field,
      v.query.sort.direction,
    ]),
  ).toEqual([
    ['focus', 'due', 'due', 'asc'],
    ['scheduled', 'plannedStart', 'plannedStart', 'asc'],
    ['priority', 'importantUrgent', 'due', 'asc'],
    ['local', 'location', 'due', 'asc'],
    ['completed', 'actualEnd', 'actualEnd', 'desc'],
    ['deleted', 'deletedAt', 'deletedAt', 'desc'],
    ['all-tasks', 'category', 'due', 'asc'],
  ]);
  expect(views[1]!.query.filters).toEqual({});
  expect(views[4]!.query.filters).toEqual({
    lifecycle: { op: 'in', values: ['closed'] },
    closureOutcome: { op: 'in', values: ['done'] },
  });
  expect(views[5]!.query).toMatchObject({
    includeClosed: true,
    includeDeleted: true,
    filters: { deletedAt: [{ op: 'isSet' }] },
  });
  for (const v of views) expect(decodeWorkspaceQuery(v.query)).toEqual(v.query);
});
it('returns independent plans and decoded queries without shared mutable data', () => {
  const a = createWorkspaceSeedPlan(),
    b = createWorkspaceSeedPlan();
  a.categories[0]!.name = 'Edited';
  a.views[4]!.query.filters.lifecycle!.values.push('draft');
  expect(b.categories[0]!.name).toBe('Family');
  expect(b.views[4]!.query.filters.lifecycle!.values).toEqual(['closed']);
  const q = b.views[4]!.query,
    decoded = decodeWorkspaceQuery(q);
  decoded.filters.lifecycle!.values.push('draft');
  expect(q.filters.lifecycle!.values).toEqual(['closed']);
});
it('normalizes canonical-equivalent names and counts graphemes instead of code units', () => {
  expect(normalizeClassificationName('  Cafe\u0301  ')).toEqual(
    normalizeClassificationName('Café'),
  );
  expect(normalizeClassificationName('WORK').nameKey).toBe('work');
  expect(normalizeClassificationName('👨‍👩‍👧‍👦'.repeat(30)).name).toBe(
    '👨‍👩‍👧‍👦'.repeat(30),
  );
  expect(() => normalizeClassificationName('a'.repeat(31))).toThrow();
  expect(() => normalizeClassificationName('  ')).toThrow();
});
it.each([undefined, '', ' Invalid/Timezone ', 'Invalid/Timezone'])(
  'requires explicit recovery for invalid timezone %s',
  (value) => {
    expect(() => validateWorkspaceTimezone(value)).toThrow(
      'timezone-selection-required',
    );
  },
);
it('accepts supported explicit timezone without overwriting its identity', () => {
  expect(validateWorkspaceTimezone('Asia/Kolkata')).toBe('Asia/Kolkata');
  expect(validateWorkspaceTimezone('UTC')).toBe('UTC');
});
it('supports filtering the grouped field and preserves inactive closure-outcome selections', () => {
  const q = base();
  q.groupBy = 'lifecycle';
  q.filters = {
    lifecycle: { op: 'in', values: ['draft'] },
    closureOutcome: { op: 'in', values: ['done'] },
  };
  expect(decodeWorkspaceQuery(q)).toEqual(q);
  expect(q.includeClosed).toBe(false);
});
it('supports mixed assigned/unassigned Location selections without requiring referenced active documents', () => {
  const q = base();
  q.filters = {
    location: {
      op: 'in',
      values: [{ kind: 'id', id: 'archived-location' }, { kind: 'unassigned' }],
    },
  };
  expect(decodeWorkspaceQuery(q)).toEqual(q);
});
it.each([
  { querySchemaVersion: 2 },
  { extra: true },
  { groupBy: 'closureOutcome' },
  { filters: { search: 'private' } },
  { filters: { lifecycle: { op: 'in', values: [] } } },
  { filters: { lifecycle: { op: 'in', values: ['draft', 'draft'] } } },
  { filters: { lifecycle: { op: 'in', values: ['unknown'] } } },
  { filters: { category: { op: 'in', values: ['../other'] } } },
  {
    filters: {
      location: { op: 'in', values: [{ kind: 'unassigned', id: 'fake' }] },
    },
  },
  {
    filters: {
      location: {
        op: 'in',
        values: [{ kind: 'unassigned' }, { kind: 'unassigned' }],
      },
    },
  },
])('rejects unsupported/ambiguous selection or envelope %j', (change) => {
  expect(() => decodeWorkspaceQuery({ ...base(), ...change })).toThrow();
});
it.each(
  [
    [{ op: 'isNotSet' }, { op: 'isSet' }],
    [
      { op: 'isNotSet' },
      { op: 'before', value: { kind: 'relativeDay', offset: 0 } },
    ],
    [
      {
        op: 'between',
        from: { kind: 'relativeDay', offset: 2 },
        to: { kind: 'relativeDay', offset: 1 },
      },
    ],
    [
      {
        op: 'between',
        from: { kind: 'relativeDay', offset: 0 },
        to: { kind: 'calendarDate', date: '2026-11-04' },
      },
    ],
    [{ op: 'before', value: { kind: 'calendarDate', date: '2026-02-30' } }],
    [
      {
        op: 'before',
        value: { kind: 'instant', value: '2026-11-04T24:00:00Z' },
      },
    ],
    [{ op: 'before', value: { kind: 'relativeDay', offset: 0.5 } }],
    [
      { op: 'onOrAfter', value: { kind: 'relativeDay', offset: 0 } },
      { op: 'before', value: { kind: 'relativeDay', offset: 0 } },
    ],
  ].map((conditions) => ({ conditions })),
)(
  'rejects invalid/structurally impossible date predicates %j',
  ({ conditions }) => {
    expect(() =>
      decodeWorkspaceQuery({ ...base(), filters: { actualEnd: conditions } }),
    ).toThrow();
  },
);
it('retains relative/absolute intersections which may become empty at evaluation time', () => {
  const q = {
    ...base(),
    filters: {
      actualEnd: [
        {
          op: 'onOrAfter',
          value: { kind: 'calendarDate', date: '2026-11-04' },
        },
        { op: 'before', value: { kind: 'relativeDay', offset: 0 } },
      ],
    },
  };
  expect(decodeWorkspaceQuery(q)).toEqual(q);
});
it('restricts Due comparisons to calendar precision while allowing exact instants on other dates', () => {
  const conditions = [
    { op: 'before', value: { kind: 'instant', value: '2026-11-04T10:30:00Z' } },
  ];
  expect(() =>
    decodeWorkspaceQuery({ ...base(), filters: { due: conditions } }),
  ).toThrow('due-instant-filter-unsupported');
  expect(
    decodeWorkspaceQuery({ ...base(), filters: { actualEnd: conditions } })
      .filters.actualEnd,
  ).toEqual(conditions);
});
it('rejects non-JSON objects rather than accepting custom inherited fields', () => {
  expect(() => decodeWorkspaceQuery(Object.create(base()))).toThrow();
});

it('accepts genuine valid range arrays with exclusive upper bounds and leap days', () => {
  const conditions = [
    {
      op: 'between',
      from: { kind: 'calendarDate', date: '2024-02-29' },
      to: { kind: 'calendarDate', date: '2024-03-01' },
    },
  ];
  expect(
    decodeWorkspaceQuery({ ...base(), filters: { due: conditions } }).filters
      .due,
  ).toEqual(conditions);
});
it('rejects contradictory arrays for the correct semantic reason', () => {
  expect(() =>
    decodeWorkspaceQuery({
      ...base(),
      filters: { due: [{ op: 'isNotSet' }, { op: 'isSet' }] },
    }),
  ).toThrow('contradictory-date-filter');
});
