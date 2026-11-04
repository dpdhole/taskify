import { WORKSPACE_TIMEZONES } from './workspace-policy';
import { decodeWorkspaceQuery } from './workspace-query';
import type { WorkspaceQuery } from './workspace-query';
import { fail } from './workspace-validation';
export const WORKSPACE_TEMPLATE_VERSION = 1;
export { WORKSPACE_SCHEMA_FAMILIES } from './workspace-families';
const categories = [
  ['family', 'Family', 'family_restroom'],
  ['finance', 'Finance', 'wallet'],
  ['friends', 'Friends', 'group'],
  ['growth', 'Growth', 'trending_up'],
  ['hobbies', 'Hobbies', 'palette'],
  ['household', 'Household', 'home_and_garden'],
  ['leisure', 'Leisure', 'weekend'],
  ['self', 'Self', 'person'],
  ['social', 'Social', 'celebration'],
  ['wellness', 'Wellness', 'heart_plus'],
  ['work', 'Work', 'work'],
  ['uncategorized', 'Uncategorized', 'category'],
] as const;
const locations = [
  ['grocery', 'Grocery', 'local_grocery_store'],
  ['gym', 'Gym', 'fitness_center'],
  ['local-stores', 'Local Stores', 'storefront'],
  ['mall', 'Mall', 'local_mall'],
  ['market', 'Market', 'store'],
  ['office', 'Office', 'business'],
  ['online', 'Online', 'language'],
  ['pharmacy', 'Pharmacy', 'local_pharmacy'],
  ['residence', 'Residence', 'home'],
  ['school', 'School', 'school'],
] as const;
/** Accepted PoC boundary: NFC/grapheme validation is client-side, not a Rules proof. */
export function normalizeClassificationName(raw: string): {
  name: string;
  nameKey: string;
} {
  if (typeof raw !== 'string') fail('invalid-classification-name');
  const name = raw.trim().normalize('NFC');
  const count = [
    ...new Intl.Segmenter('und', { granularity: 'grapheme' }).segment(name),
  ].length;
  if (!name || count > 30) fail('invalid-classification-name');
  return { name, nameKey: name.toLowerCase() };
}
const supportedTimezones = new Set<string>(WORKSPACE_TIMEZONES);
export function validateWorkspaceTimezone(raw: unknown): string {
  if (typeof raw !== 'string' || !supportedTimezones.has(raw))
    fail('timezone-selection-required');
  // Deliberately no implicit UTC/browser/provider fallback.
  try {
    new Intl.DateTimeFormat('en', { timeZone: raw }).format(0);
  } catch {
    fail('timezone-selection-required');
  }
  return raw;
}
export interface NamedSeed {
  id: string;
  name: string;
  nameKey: string;
  icon: string;
  archived: false;
  order: number;
}
export interface ViewSeed {
  id: string;
  name: string;
  query: WorkspaceQuery;
  showOnHome: true;
  order: number;
}
function query(
  groupBy: WorkspaceQuery['groupBy'],
  field: WorkspaceQuery['sort']['field'] = 'due',
  direction: 'asc' | 'desc' = 'asc',
  filters: WorkspaceQuery['filters'] = {},
  includeClosed = false,
  includeDeleted = false,
): WorkspaceQuery {
  return decodeWorkspaceQuery({
    querySchemaVersion: 1,
    includeClosed,
    includeDeleted,
    filters,
    groupBy,
    sort: { field, direction },
  });
}
/** Fresh seed content only: not persisted records, no timestamps, UID or completion claims.
 * The future initializer must use these only for unfinished stages; never backfill. */
export function createWorkspaceSeedPlan(): {
  templateVersion: 1;
  categories: NamedSeed[];
  locations: NamedSeed[];
  views: ViewSeed[];
} {
  const named = (
    rows: readonly (readonly [string, string, string])[],
  ): NamedSeed[] =>
    rows.map(([id, name, icon], index) => ({
      id,
      ...normalizeClassificationName(name),
      icon,
      archived: false,
      order: (index + 1) * 1000,
    }));
  const views: Omit<ViewSeed, 'order' | 'showOnHome'>[] = [
    { id: 'focus', name: 'Focus', query: query('due') },
    {
      id: 'scheduled',
      name: 'Scheduled',
      query: query('plannedStart', 'plannedStart'),
    },
    { id: 'priority', name: 'Priority', query: query('importantUrgent') },
    { id: 'local', name: 'Local', query: query('location') },
    {
      id: 'completed',
      name: 'Completed',
      query: query(
        'actualEnd',
        'actualEnd',
        'desc',
        {
          lifecycle: { op: 'in', values: ['closed'] },
          closureOutcome: { op: 'in', values: ['done'] },
        },
        true,
      ),
    },
    {
      id: 'deleted',
      name: 'Deleted',
      query: query(
        'deletedAt',
        'deletedAt',
        'desc',
        { deletedAt: [{ op: 'isSet' }] },
        true,
        true,
      ),
    },
    { id: 'all-tasks', name: 'All Tasks', query: query('category') },
  ];
  return {
    templateVersion: WORKSPACE_TEMPLATE_VERSION,
    categories: named(categories),
    locations: named(locations),
    views: views.map((view, index) => ({
      ...view,
      showOnHome: true,
      order: (index + 1) * 1000,
    })),
  };
}
