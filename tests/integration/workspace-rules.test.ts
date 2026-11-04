import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
import fs from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  getDocs,
  collection,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { WORKSPACE_SCHEMA_FAMILIES } from '../../src/domain/workspace-seeds';
import { WORKSPACE_TIMEZONES } from '../../src/domain/workspace-policy';
import { stageWrites } from '../support/workspace-write-fixtures';
import { contract } from '../support/compatibility-fixtures';
let env: RulesTestEnvironment;
const projectId = 'demo-taskify-workspace-production',
  uid = 'owner-production';
const policy = () =>
  contract({
    environmentId: projectId,
    recordFamilies: {
      ...contract().recordFamilies,
      ...Object.fromEntries(
        WORKSPACE_SCHEMA_FAMILIES.map((f) => [
          f,
          { presentSchemaVersions: [1], allowedWriteSchemaVersions: [1] },
        ]),
      ),
    },
  });
beforeAll(async () => {
  if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080')
    throw Error('Checked loopback emulator required');
  env = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: fs.readFileSync('firestore.workspace.rules', 'utf8'),
    },
  });
});
afterAll(async () => {
  await env?.cleanup();
});
beforeEach(async () => {
  await env.clearFirestore();
  await publish(policy());
});
const db = () => env.authenticatedContext(uid).firestore();
async function publish(value: unknown) {
  await env.withSecurityRulesDisabled((c) =>
    setDoc(doc(c.firestore(), 'runtime/compatibility'), value),
  );
}
function base(timezone = 'UTC', profile: Record<string, unknown> = {}) {
  const result = stageWrites(uid, 0);
  Object.assign(result.find((w) => w.path.endsWith('/settings/main'))!.data, {
    timezone,
  });
  Object.assign(
    result.find((w) => w.path.endsWith('/profile/main'))!.data,
    profile,
  );
  return result;
}
function commit(data: ReturnType<typeof base>) {
  const client = db(),
    batch = writeBatch(client);
  for (const w of data) batch.set(doc(client, w.path), w.data);
  return batch.commit();
}
it.each([
  'UTC',
  'Asia/Kolkata',
  'Asia/Calcutta',
  'America/New_York',
  'Europe/Kyiv',
  'Australia/Lord_Howe',
  'Etc/GMT+5',
  'Pacific/Chatham',
])(
  'accepts supported timezone %s and optional social profile',
  async (zone) => {
    await assertSucceeds(
      commit(
        base(zone, {
          displayName: 'Synthetic profile',
          photoUrl: 'https://example.invalid/photo.png',
        }),
      ),
    );
    expect(
      (await getDoc(doc(db(), `users/${uid}/settings/main`))).data()?.timezone,
    ).toBe(zone);
  },
);
it.each(['Not/AZone', ' utc ', '+05:30', 'UTC-extra'])(
  'rejects invalid/unlisted timezone %s atomically',
  async (zone) => {
    await assertFails(commit(base(zone)));
    expect(
      (
        await getDoc(doc(db(), `users/${uid}/initialization/workspace`))
      ).exists(),
    ).toBe(false);
  },
);
it('checks pinned timezone entries are unique and India aliases remain usable', () => {
  expect(new Set(WORKSPACE_TIMEZONES).size).toBe(WORKSPACE_TIMEZONES.length);
  expect(WORKSPACE_TIMEZONES).toContain('Asia/Kolkata');
  expect(WORKSPACE_TIMEZONES).toContain('Asia/Calcutta');
});
it.each([
  { displayName: null },
  { displayName: '' },
  { displayName: ' padded ' },
  { displayName: 'x'.repeat(1025) },
  { photoUrl: null },
  { photoUrl: 'http://example.invalid/photo' },
  { photoUrl: 'javascript:invalid' },
  { photoUrl: 'https://user@example.invalid/photo' },
  { photoUrl: 'https://example.invalid/a b' },
  { photoUrl: 'https://example.invalid/' + 'x'.repeat(8192) },
  { unknown: 'field' },
])(
  'rejects invalid profile fields without committing setup %j',
  async (profile) => {
    await assertFails(commit(base('UTC', profile)));
    expect(
      (await getDoc(doc(db(), `users/${uid}/profile/main`))).exists(),
    ).toBe(false);
  },
);
it('uses UTF-8 bytes consistently for Unicode profile boundaries', async () => {
  await assertSucceeds(commit(base('UTC', { displayName: '😀'.repeat(256) })));
  await env.clearFirestore();
  await publish(policy());
  await assertFails(commit(base('UTC', { displayName: '😀'.repeat(257) })));
});
it('rejects policy for another environment, unknown format, and incoherent schema admission', async () => {
  await publish({ ...policy(), environmentId: 'wrong-environment' });
  await assertFails(commit(base()));
  await publish({ ...policy(), contractFormatVersion: 2 });
  await assertFails(commit(base()));
  const bad = policy();
  bad.recordFamilies.settings!.presentSchemaVersions = [2];
  await publish(bad);
  await assertFails(commit(base()));
});
it('denies forged timestamps, versions and extra settings fields', async () => {
  for (const change of [
    { recordVersion: 2 },
    { timezone: 'UTC', extra: true },
    { createdAt: new Date(0) },
  ]) {
    const data = base();
    Object.assign(
      data.find((w) => w.path.endsWith('/settings/main'))!.data,
      change,
    );
    await assertFails(commit(data));
  }
});
it('blocks workspace reads and writes when any deletion control exists, while allowing own status only', async () => {
  await commit(base());
  await env.withSecurityRulesDisabled((c) =>
    setDoc(doc(c.firestore(), `accountDeletion/${uid}`), {
      schemaVersion: 99,
      state: 'unrecognized',
    }),
  );
  await assertFails(getDoc(doc(db(), `users/${uid}/profile/main`)));
  await assertFails(getDocs(collection(db(), `users/${uid}/settings`)));
  await assertFails(commit(stageWrites(uid, 1)));
  expect((await getDoc(doc(db(), `accountDeletion/${uid}`))).exists()).toBe(
    true,
  );
  await assertFails(
    setDoc(doc(db(), `accountDeletion/${uid}`), { state: 'cleared' }),
  );
});
it('does not enable Delete Account request creation or arbitrary root user documents', async () => {
  await assertFails(
    setDoc(doc(db(), `accountDeletion/${uid}`), {
      schemaVersion: 1,
      jobId: 'fake',
      inventoryVersion: 1,
      state: 'requested',
      requestedAt: serverTimestamp(),
    }),
  );
  await assertFails(setDoc(doc(db(), `users/${uid}`), { schemaVersion: 1 }));
});
it('preserves get-only public contract and denies policy publication by clients', async () => {
  expect(
    (
      await getDoc(
        doc(env.unauthenticatedContext().firestore(), 'runtime/compatibility'),
      )
    ).exists(),
  ).toBe(true);
  await assertFails(getDocs(collection(db(), 'runtime')));
  await assertFails(setDoc(doc(db(), 'runtime/compatibility'), policy()));
});
it('never refreshes profile or settings from a later provider sign-in', async () => {
  await commit(base('Asia/Kolkata', { displayName: 'Captured once' }));
  await assertFails(
    updateDoc(doc(db(), `users/${uid}/profile/main`), {
      displayName: 'Replacement',
      recordVersion: 2,
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(db(), `users/${uid}/settings/main`), {
      timezone: 'UTC',
      recordVersion: 2,
      updatedAt: serverTimestamp(),
    }),
  );
});

it('retains the first committed profile/timezone when two clients propose different initial settings', async () => {
  const choices = [
    base('Asia/Kolkata', { displayName: 'First proposal' }),
    base('America/New_York', { displayName: 'Second proposal' }),
  ];
  const results = await Promise.allSettled(choices.map(commit));
  expect(
    results.filter((result) => result.status === 'fulfilled'),
  ).toHaveLength(1);
  const winner = results.findIndex((result) => result.status === 'fulfilled');
  expect(
    (await getDoc(doc(db(), `users/${uid}/settings/main`))).data()?.timezone,
  ).toBe(winner === 0 ? 'Asia/Kolkata' : 'America/New_York');
  expect(
    (await getDoc(doc(db(), `users/${uid}/profile/main`))).data()?.displayName,
  ).toBe(winner === 0 ? 'First proposal' : 'Second proposal');
});
it('accepts all pinned timezone IDs and aliases through actual production Rules', async () => {
  for (const zone of WORKSPACE_TIMEZONES) {
    await assertSucceeds(commit(base(zone)));
    await env.withSecurityRulesDisabled(async (c) => {
      const client = c.firestore(),
        batch = writeBatch(client);
      for (const path of [
        `users/${uid}/initialization/workspace`,
        `users/${uid}/profile/main`,
        `users/${uid}/settings/main`,
        `users/${uid}/initializationStages/base`,
      ])
        batch.delete(doc(client, path));
      await batch.commit();
    });
  }
}, 120000);
