import { expect, it } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import type { DocumentSnapshot } from 'firebase/firestore';
import { decodeFirestoreWorkspaceRecord } from '../../src/infrastructure/firebase/workspace-record-decoder';
function snapshot(change: Record<string, unknown> = {}) {
  return {
    id: 'main',
    ref: { path: 'users/owner/settings/main' },
    metadata: { fromCache: false, hasPendingWrites: false },
    exists: () => true,
    data: () => ({
      schemaVersion: 1,
      recordVersion: 1,
      createdAt: new Timestamp(100, 123456789),
      updatedAt: new Timestamp(100, 123456789),
      timezone: 'UTC',
    }),
    ...change,
  } as unknown as DocumentSnapshot;
}
it('translates confirmed SDK timestamps losslessly without leaking SDK instances into the domain', () => {
  const result = decodeFirestoreWorkspaceRecord(
    'owner',
    'settings',
    snapshot(),
  );
  expect(result).toMatchObject({
    createdAt: { seconds: 100, nanoseconds: 123456789 },
    timezone: 'UTC',
  });
});
it.each([
  { fromCache: true, hasPendingWrites: false },
  { fromCache: false, hasPendingWrites: true },
])('rejects unconfirmed snapshots %j', (metadata) => {
  expect(() =>
    decodeFirestoreWorkspaceRecord('owner', 'settings', snapshot({ metadata })),
  ).toThrow('workspace-unconfirmed');
});
it('rejects old-account paths even when the document itself is valid', () => {
  expect(() =>
    decodeFirestoreWorkspaceRecord('new-owner', 'settings', snapshot()),
  ).toThrow('workspace-account-mismatch');
});
it('rejects missing records and forged/plain-object timestamp payloads', () => {
  expect(() =>
    decodeFirestoreWorkspaceRecord(
      'owner',
      'settings',
      snapshot({ exists: () => false }),
    ),
  ).toThrow('workspace-record-missing');
  expect(() =>
    decodeFirestoreWorkspaceRecord(
      'owner',
      'settings',
      snapshot({
        data: () => ({
          schemaVersion: 1,
          recordVersion: 1,
          createdAt: { seconds: 100, nanoseconds: 0 },
          updatedAt: new Timestamp(100, 0),
          timezone: 'UTC',
        }),
      }),
    ),
  ).toThrow('invalid-workspace-timestamp');
});

it('uses actual URL parsing at the profile boundary, rejecting malformed ports and credentials', () => {
  const data = {
    schemaVersion: 1,
    recordVersion: 1,
    createdAt: new Timestamp(100, 0),
    updatedAt: new Timestamp(100, 0),
  };
  for (const photoUrl of [
    'https://example.invalid:bad/a',
    'https://user:password@example.invalid/a',
  ]) {
    expect(() =>
      decodeFirestoreWorkspaceRecord(
        'owner',
        'profile',
        snapshot({
          ref: { path: 'users/owner/profile/main' },
          data: () => ({ ...data, photoUrl }),
        }),
      ),
    ).toThrow('invalid-profile-photo');
  }
});
