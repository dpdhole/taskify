import { Timestamp } from 'firebase/firestore';
import type { DocumentSnapshot } from 'firebase/firestore';
import { decodeWorkspaceRecord } from '../../domain/workspace-records';
import type { WorkspaceRecordFamily } from '../../domain/workspace-records';
import { fail, object, recordId } from '../../domain/workspace-validation';
const collections = {
  workspaceInitialization: 'initialization',
  profile: 'profile',
  settings: 'settings',
  category: 'categories',
  location: 'locations',
  view: 'views',
  initializationStage: 'initializationStages',
} as const;
/** Snapshot translation only. Caller still binds UID/session/admission before publication. */
export function decodeFirestoreWorkspaceRecord(
  uid: string,
  family: WorkspaceRecordFamily,
  snapshot: DocumentSnapshot,
) {
  recordId(uid);
  if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites)
    fail('workspace-unconfirmed');
  if (!snapshot.exists()) fail('workspace-record-missing');
  const segments = snapshot.ref.path.split('/');
  const valid =
    family === 'nameReservation'
      ? segments.length === 6 &&
        segments[0] === 'users' &&
        segments[1] === uid &&
        segments[2] === 'nameKeys' &&
        ['categories', 'locations'].includes(segments[3]!) &&
        segments[4] === 'keys'
      : segments.length === 4 &&
        segments[0] === 'users' &&
        segments[1] === uid &&
        segments[2] === collections[family];
  if (!valid) fail('workspace-account-mismatch');
  const raw = { ...object(snapshot.data()) };
  if (family === 'profile' && typeof raw.photoUrl === 'string') {
    try {
      const url = new URL(raw.photoUrl);
      if (
        url.protocol !== 'https:' ||
        !url.hostname ||
        url.username ||
        url.password
      )
        fail('invalid-profile-photo');
    } catch {
      fail('invalid-profile-photo');
    }
  }
  for (const field of ['createdAt', 'updatedAt', 'completedAt']) {
    if (!Object.hasOwn(raw, field)) continue;
    const value = raw[field];
    if (!(value instanceof Timestamp)) fail('invalid-workspace-timestamp');
    raw[field] = { seconds: value.seconds, nanoseconds: value.nanoseconds };
  }
  return decodeWorkspaceRecord(family, snapshot.id, raw);
}
