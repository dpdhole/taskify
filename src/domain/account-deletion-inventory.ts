import { decodeWorkspaceRecord } from './workspace-records';
import type { WorkspaceRecordFamily } from './workspace-records';
import { workspaceStages } from './workspace-stages';
import { object, recordId } from './workspace-validation';

export class DeletionInventoryError extends Error {
  constructor(readonly reason: 'inventory-unsupported' | 'data-invalid') {
    super(reason);
  }
}
const unsupported = (): never => {
  throw new DeletionInventoryError('inventory-unsupported');
};
const pathParts = (path: string): string[] => {
  const parts = path.split('/');
  try {
    parts.forEach(recordId);
  } catch {
    return unsupported();
  }
  return parts;
};
export type DeletionInventoryFamily = WorkspaceRecordFamily | 'container';
/** Exact namespace check; absent parent data is not a reason to skip its children. */
export function deletionInventoryFamily(
  uid: string,
  path: string,
): DeletionInventoryFamily {
  try {
    recordId(uid);
  } catch {
    return unsupported();
  }
  const p = pathParts(path);
  if (p[0] !== 'users' || p[1] !== uid || p.length % 2 !== 0)
    return unsupported();
  if (p.length === 2) return 'container';
  if (p.length === 4) {
    const kind = p[2],
      id = p[3];
    if (kind === 'nameKeys' && (id === 'categories' || id === 'locations'))
      return 'container';
    if (kind === 'profile' && id === 'main') return 'profile';
    if (kind === 'settings' && id === 'main') return 'settings';
    if (kind === 'initialization' && id === 'workspace')
      return 'workspaceInitialization';
    if (
      kind === 'initializationStages' &&
      workspaceStages.some((stage) => stage.id === id)
    )
      return 'initializationStage';
    if (kind === 'categories') return 'category';
    if (kind === 'locations') return 'location';
    if (kind === 'views') return 'view';
  }
  if (
    p.length === 6 &&
    p[2] === 'nameKeys' &&
    (p[3] === 'categories' || p[3] === 'locations') &&
    p[4] === 'keys' &&
    /^[a-f0-9]{64}$/u.test(p[5]!)
  )
    return 'nameReservation';
  return unsupported();
}
/** Validate collection references too, including unsupported empty collections. */
export function assertDeletionCollection(uid: string, path: string): void {
  const p = pathParts(path);
  if (p.length % 2 !== 1 || p[0] !== 'users' || p[1] !== uid) unsupported();
  if (
    p.length === 3 &&
    [
      'profile',
      'settings',
      'categories',
      'locations',
      'views',
      'initialization',
      'initializationStages',
      'nameKeys',
    ].includes(p[2]!)
  )
    return;
  if (
    p.length === 5 &&
    p[2] === 'nameKeys' &&
    (p[3] === 'categories' || p[3] === 'locations') &&
    p[4] === 'keys'
  )
    return;
  unsupported();
}
/** Infrastructure supplies normalized snapshots, not Firebase SDK Timestamp objects. */
export function validateDeletionInventoryRecord(
  uid: string,
  path: string,
  data: unknown,
): DeletionInventoryFamily {
  const family = deletionInventoryFamily(uid, path);
  try {
    if (family === 'container') {
      if (Object.keys(object(data)).length) throw Error();
    } else decodeWorkspaceRecord(family, path.split('/').at(-1)!, data);
  } catch {
    throw new DeletionInventoryError('data-invalid');
  }
  return family;
}
