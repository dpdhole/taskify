import {
  PROFILE_NAME_MAX_BYTES,
  PROFILE_PHOTO_MAX_BYTES,
} from './workspace-policy';
import { decodeWorkspaceQuery } from './workspace-query';
import type { WorkspaceQuery } from './workspace-query';
import {
  createWorkspaceSeedPlan,
  normalizeClassificationName,
  validateWorkspaceTimezone,
} from './workspace-seeds';
import {
  boolean,
  fail,
  keys,
  member,
  object,
  recordId,
  safeInteger,
  utf8Length,
} from './workspace-validation';
/** Lossless domain representation; infrastructure converts Firestore Timestamp values. */
export interface WorkspaceTimestamp {
  seconds: number;
  nanoseconds: number;
}
export interface MutableMetadata {
  schemaVersion: 1;
  recordVersion: number;
  createdAt: WorkspaceTimestamp;
  updatedAt: WorkspaceTimestamp;
}
export type WorkspaceRecord =
  | (MutableMetadata & {
      templateVersion: 1;
      status: 'initializing' | 'complete';
      completedAt?: WorkspaceTimestamp;
    })
  | (MutableMetadata & { displayName?: string; photoUrl?: string })
  | (MutableMetadata & { timezone: string })
  | (MutableMetadata & {
      name: string;
      nameKey: string;
      icon: string;
      archived: boolean;
      order: number;
    })
  | (MutableMetadata & {
      name: string;
      query: WorkspaceQuery;
      showOnHome: boolean;
      order: number;
    })
  | { schemaVersion: 1; templateVersion: 1; completedAt: WorkspaceTimestamp }
  | {
      schemaVersion: 1;
      nameKey: string;
      entityId: string;
      createdAt: WorkspaceTimestamp;
    };
export type WorkspaceRecordFamily =
  | 'workspaceInitialization'
  | 'profile'
  | 'settings'
  | 'category'
  | 'location'
  | 'view'
  | 'initializationStage'
  | 'nameReservation';
export function decodeWorkspaceTimestamp(value: unknown): WorkspaceTimestamp {
  const v = object(value);
  keys(v, ['seconds', 'nanoseconds']);
  const seconds = safeInteger(v.seconds),
    nanoseconds = safeInteger(v.nanoseconds);
  if (seconds < 0 || nanoseconds < 0 || nanoseconds > 999999999)
    fail('invalid-workspace-timestamp');
  return { seconds, nanoseconds };
}
function compare(a: WorkspaceTimestamp, b: WorkspaceTimestamp) {
  return a.seconds - b.seconds || a.nanoseconds - b.nanoseconds;
}
function text(value: unknown): string {
  if (typeof value !== 'string' || !value || value !== value.trim()) fail();
  return value;
}
function metadata(v: Record<string, unknown>): MutableMetadata {
  if (v.schemaVersion !== 1) fail('unsupported-workspace-schema');
  const recordVersion = safeInteger(v.recordVersion);
  if (recordVersion < 1) fail();
  const createdAt = decodeWorkspaceTimestamp(v.createdAt),
    updatedAt = decodeWorkspaceTimestamp(v.updatedAt);
  if (compare(createdAt, updatedAt) > 0) fail('invalid-workspace-timestamp');
  return { schemaVersion: 1, recordVersion, createdAt, updatedAt };
}
/** Reads normalized persisted records. No upgrades, repairs or SDK dependencies. */
export function decodeWorkspaceRecord(
  family: WorkspaceRecordFamily,
  id: string,
  raw: unknown,
): WorkspaceRecord {
  recordId(id);
  const v = object(raw);
  if (v.schemaVersion !== 1) fail('unsupported-workspace-schema');
  if (family === 'initializationStage') {
    keys(v, ['schemaVersion', 'templateVersion', 'completedAt']);
    if (v.templateVersion !== 1) fail('unsupported-workspace-template');
    return {
      schemaVersion: 1,
      templateVersion: 1,
      completedAt: decodeWorkspaceTimestamp(v.completedAt),
    };
  }
  if (family === 'nameReservation') {
    keys(v, ['schemaVersion', 'nameKey', 'entityId', 'createdAt']);
    if (!/^[a-f0-9]{64}$/u.test(id)) fail('invalid-name-reservation-id');
    return {
      schemaVersion: 1,
      nameKey: text(v.nameKey),
      entityId: recordId(v.entityId),
      createdAt: decodeWorkspaceTimestamp(v.createdAt),
    };
  }
  const meta = metadata(v),
    common = ['schemaVersion', 'recordVersion', 'createdAt', 'updatedAt'];
  if (family === 'workspaceInitialization') {
    keys(v, [...common, 'templateVersion', 'status'], ['completedAt']);
    if (id !== 'workspace' || v.templateVersion !== 1)
      fail('unsupported-workspace-template');
    const status = member(v.status, ['initializing', 'complete']);
    if ((status === 'complete') !== Object.hasOwn(v, 'completedAt')) fail();
    if (status === 'complete') {
      const completedAt = decodeWorkspaceTimestamp(v.completedAt);
      if (
        compare(completedAt, meta.createdAt) < 0 ||
        compare(completedAt, meta.updatedAt) > 0
      )
        fail();
      return { ...meta, templateVersion: 1, status, completedAt };
    }
    return { ...meta, templateVersion: 1, status };
  }
  if (family === 'profile') {
    keys(v, common, ['displayName', 'photoUrl']);
    if (id !== 'main') fail();
    const result: MutableMetadata & {
      displayName?: string;
      photoUrl?: string;
    } = { ...meta };
    if (Object.hasOwn(v, 'displayName')) {
      result.displayName = text(v.displayName);
      if (utf8Length(result.displayName) > PROFILE_NAME_MAX_BYTES)
        fail('profile-name-too-large');
    }
    if (Object.hasOwn(v, 'photoUrl')) {
      const photoUrl = text(v.photoUrl);
      if (utf8Length(photoUrl) > PROFILE_PHOTO_MAX_BYTES)
        fail('profile-photo-too-large');
      // Full URL parsing belongs to the infrastructure profile snapshot boundary.
      if (!/^https:\/\/[^\s/?#@]+(?:[/?#][^\s]*)?$/u.test(photoUrl))
        fail('invalid-profile-photo');
      result.photoUrl = photoUrl;
    }
    return result;
  }
  if (family === 'settings') {
    keys(v, [...common, 'timezone']);
    if (id !== 'main') fail();
    return { ...meta, timezone: validateWorkspaceTimezone(v.timezone) };
  }
  if (family === 'category' || family === 'location') {
    keys(v, [...common, 'name', 'nameKey', 'icon', 'archived', 'order']);
    const name = text(v.name),
      normalized = normalizeClassificationName(name);
    if (normalized.name !== name || normalized.nameKey !== v.nameKey)
      fail('invalid-name-key');
    const plan = createWorkspaceSeedPlan();
    const icons = [...plan.categories, ...plan.locations].map(
      (seed) => seed.icon,
    );
    const icon = member(v.icon, icons),
      archived = boolean(v.archived),
      order = safeInteger(v.order);
    if (
      family === 'category' &&
      (id === 'uncategorized'
        ? name !== 'Uncategorized' || icon !== 'category' || archived
        : v.nameKey === 'uncategorized')
    )
      fail('protected-category');
    if (family === 'location' && id === 'unspecified')
      fail('synthetic-location');
    return {
      ...meta,
      name,
      nameKey: normalized.nameKey,
      icon,
      archived,
      order,
    };
  }
  if (family === 'view') {
    keys(v, [...common, 'name', 'query', 'showOnHome', 'order']);
    const name = text(v.name),
      query = decodeWorkspaceQuery(v.query),
      showOnHome = boolean(v.showOnHome),
      order = safeInteger(v.order);
    if (id === 'all-tasks') {
      const expected = createWorkspaceSeedPlan().views.find(
        (seed) => seed.id === id,
      )!;
      if (
        name !== expected.name ||
        !showOnHome ||
        query.includeClosed ||
        query.includeDeleted ||
        Object.keys(query.filters).length !== 0 ||
        query.groupBy !== 'category' ||
        query.sort.field !== 'due' ||
        query.sort.direction !== 'asc'
      )
        fail('protected-view');
    }
    return { ...meta, name, query, showOnHome, order };
  }
  return fail('unknown-workspace-family');
}
