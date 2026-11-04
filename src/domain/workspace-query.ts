import {
  boolean,
  calendarDate,
  fail,
  instant,
  keys,
  member,
  object,
  recordId,
  safeInteger,
} from './workspace-validation';
export const DATE_FIELDS = [
  'createdAt',
  'plannedStart',
  'due',
  'actualStart',
  'actualEnd',
  'pausedUntil',
  'deletedAt',
] as const;
export const GROUP_FIELDS = [
  'category',
  'location',
  'lifecycle',
  'importantUrgent',
  ...DATE_FIELDS,
] as const;
export const SORT_FIELDS = ['title', ...GROUP_FIELDS] as const;
const selections = {
  lifecycle: ['draft', 'inProgress', 'closed'],
  paused: ['paused', 'notPaused'],
  closureOutcome: [
    'done',
    'cancelled',
    'unableToComplete',
    'noLongerApplicable',
    'duplicate',
    'other',
  ],
  importantUrgent: [
    'doFirst',
    'schedule',
    'delegate',
    'eliminate',
    'unclassified',
  ],
} as const;
export type DateOperand =
  | { kind: 'calendarDate'; date: string }
  | { kind: 'relativeDay'; offset: number }
  | { kind: 'instant'; value: string };
export type DateCondition =
  | { op: 'isSet' | 'isNotSet' }
  | { op: 'before' | 'onOrAfter'; value: DateOperand }
  | { op: 'between'; from: DateOperand; to: DateOperand };
type Selection = { op: 'in'; values: string[] };
type LocationValue = { kind: 'id'; id: string } | { kind: 'unassigned' };
export type QueryFilters = Partial<
  Record<keyof typeof selections | 'category', Selection>
> & { location?: { op: 'in'; values: LocationValue[] } } & Partial<
    Record<(typeof DATE_FIELDS)[number], DateCondition[]>
  >;
export interface WorkspaceQuery {
  querySchemaVersion: 1;
  includeClosed: boolean;
  includeDeleted: boolean;
  filters: QueryFilters;
  groupBy: (typeof GROUP_FIELDS)[number];
  sort: { field: (typeof SORT_FIELDS)[number]; direction: 'asc' | 'desc' };
}
function nonempty(value: unknown): unknown[] {
  if (!Array.isArray(value) || !value.length) fail();
  return value;
}
function operand(value: unknown, due: boolean): DateOperand {
  const v = object(value);
  const kind = member(v.kind, ['calendarDate', 'relativeDay', 'instant']);
  if (kind === 'calendarDate') {
    keys(v, ['kind', 'date']);
    return { kind, date: calendarDate(v.date) };
  }
  if (kind === 'relativeDay') {
    keys(v, ['kind', 'offset']);
    return { kind, offset: safeInteger(v.offset) };
  }
  if (due) fail('due-instant-filter-unsupported');
  keys(v, ['kind', 'value']);
  return { kind, value: instant(v.value) };
}
function compare(a: DateOperand, b: DateOperand): number | undefined {
  if (a.kind === 'calendarDate' && b.kind === 'calendarDate')
    return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
  if (a.kind === 'relativeDay' && b.kind === 'relativeDay')
    return a.offset < b.offset ? -1 : a.offset > b.offset ? 1 : 0;
  if (a.kind === 'instant' && b.kind === 'instant')
    return Math.sign(Date.parse(a.value) - Date.parse(b.value));
  // Calendar dates vs instants require timezone; relative vs absolute requires now.
  return undefined;
}
function dateConditions(value: unknown, due: boolean): DateCondition[] {
  const result: DateCondition[] = nonempty(value).map((raw): DateCondition => {
    const v = object(raw);
    const op = member(v.op, [
      'isSet',
      'isNotSet',
      'before',
      'onOrAfter',
      'between',
    ]);
    if (op === 'isSet' || op === 'isNotSet') {
      keys(v, ['op']);
      return { op };
    }
    if (op === 'between') {
      keys(v, ['op', 'from', 'to']);
      const from = operand(v.from, due),
        to = operand(v.to, due);
      if (from.kind !== to.kind || compare(from, to)! >= 0)
        fail('invalid-date-range');
      return { op, from, to };
    }
    keys(v, ['op', 'value']);
    return { op, value: operand(v.value, due) };
  });
  if (
    result.some((c) => c.op === 'isNotSet') &&
    result.some((c) => c.op !== 'isNotSet')
  )
    fail('contradictory-date-filter');
  const lower: DateOperand[] = [],
    upper: DateOperand[] = [];
  for (const c of result) {
    if ('from' in c) {
      lower.push(c.from);
      upper.push(c.to);
    } else if ('value' in c) (c.op === 'before' ? upper : lower).push(c.value);
  }
  if (
    lower.some((a) =>
      upper.some((b) => {
        const order = compare(a, b);
        return order !== undefined && order >= 0;
      }),
    )
  )
    fail('contradictory-date-filter');
  return result;
}
/** Validates persisted query meaning, without executing Task queries or reading references. */
export function decodeWorkspaceQuery(raw: unknown): WorkspaceQuery {
  const v = object(raw);
  keys(v, [
    'querySchemaVersion',
    'includeClosed',
    'includeDeleted',
    'filters',
    'groupBy',
    'sort',
  ]);
  if (v.querySchemaVersion !== 1) fail('unsupported-query-schema');
  const input = object(v.filters),
    filters: Record<string, unknown> = {};
  for (const [field, rawFilter] of Object.entries(input)) {
    if ((DATE_FIELDS as readonly string[]).includes(field)) {
      filters[field] = dateConditions(rawFilter, field === 'due');
      continue;
    }
    if (
      field !== 'category' &&
      field !== 'location' &&
      !Object.hasOwn(selections, field)
    )
      fail('unknown-query-field');
    const f = object(rawFilter);
    keys(f, ['op', 'values']);
    if (f.op !== 'in') fail();
    const values = nonempty(f.values).map((value) => {
      if (field === 'category') return recordId(value);
      if (field === 'location') {
        const loc = object(value),
          kind = member(loc.kind, ['id', 'unassigned']);
        if (kind === 'unassigned') {
          keys(loc, ['kind']);
          return { kind };
        }
        keys(loc, ['kind', 'id']);
        return { kind, id: recordId(loc.id) };
      }
      return member(value, selections[field as keyof typeof selections]);
    });
    if (
      new Set(values.map((value) => JSON.stringify(value))).size !==
      values.length
    )
      fail('duplicate-selection');
    filters[field] = { op: 'in', values };
  }
  const sort = object(v.sort);
  keys(sort, ['field', 'direction']);
  return {
    querySchemaVersion: 1,
    includeClosed: boolean(v.includeClosed),
    includeDeleted: boolean(v.includeDeleted),
    filters: filters as QueryFilters,
    groupBy: member(v.groupBy, GROUP_FIELDS),
    sort: {
      field: member(sort.field, SORT_FIELDS),
      direction: member(sort.direction, ['asc', 'desc']),
    },
  };
}
