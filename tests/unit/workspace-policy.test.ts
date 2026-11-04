import { expect, it } from 'vitest';
import {
  WORKSPACE_TIMEZONES,
  PROFILE_NAME_MAX_BYTES,
  PROFILE_PHOTO_MAX_BYTES,
} from '../../src/domain/workspace-policy';
import { validateWorkspaceTimezone } from '../../src/domain/workspace-seeds';
import { decodeWorkspaceRecord } from '../../src/domain/workspace-records';
import { utf8Length } from '../../src/domain/workspace-validation';
const meta = {
  schemaVersion: 1,
  recordVersion: 1,
  createdAt: { seconds: 100, nanoseconds: 0 },
  updatedAt: { seconds: 100, nanoseconds: 0 },
};
it('accepts every pinned timezone/alias supported by the reference runtime without rewriting its identity', () => {
  for (const zone of WORKSPACE_TIMEZONES)
    expect(validateWorkspaceTimezone(zone)).toBe(zone);
});
it.each(['UTC-extra', '+05:30', 'Invalid/Zone'])(
  'rejects unlisted timezone %s',
  (zone) => {
    expect(() => validateWorkspaceTimezone(zone)).toThrow();
  },
);
it('counts UTF-8 and rejects malformed Unicode without browser globals', () => {
  expect(utf8Length('Aé中😀')).toBe(10);
  expect(() => utf8Length('\ud800')).toThrow('invalid-unicode');
});
it('enforces matching profile byte limits without truncating or silently dropping social data', () => {
  expect(
    decodeWorkspaceRecord('profile', 'main', {
      ...meta,
      displayName: '😀'.repeat(PROFILE_NAME_MAX_BYTES / 4),
    }),
  ).toMatchObject({ displayName: '😀'.repeat(256) });
  expect(() =>
    decodeWorkspaceRecord('profile', 'main', {
      ...meta,
      displayName: 'x'.repeat(PROFILE_NAME_MAX_BYTES + 1),
    }),
  ).toThrow('profile-name-too-large');
  const prefix = 'https://example.invalid/';
  expect(
    decodeWorkspaceRecord('profile', 'main', {
      ...meta,
      photoUrl: prefix + 'x'.repeat(PROFILE_PHOTO_MAX_BYTES - prefix.length),
    }),
  ).toMatchObject({ photoUrl: expect.any(String) });
  expect(() =>
    decodeWorkspaceRecord('profile', 'main', {
      ...meta,
      photoUrl: prefix + 'x'.repeat(PROFILE_PHOTO_MAX_BYTES),
    }),
  ).toThrow('profile-photo-too-large');
});
