import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
import fs from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { WORKSPACE_SCHEMA_FAMILIES } from '../../src/domain/workspace-families';
import { stageWrites } from '../support/workspace-write-fixtures';
import { contract } from '../support/compatibility-fixtures';
let env: RulesTestEnvironment;
const projectId = 'demo-taskify-deletion-rules';
const uid = 'old-account';
const job = '11111111-1111-4111-8111-111111111111';
const controlPath = `accountDeletion/${uid}`;
const now = () => Math.floor(Date.now() / 1000);
const policy = () =>
  contract({
    environmentId: projectId,
    revision: 3,
    serverRelease: 3,
    minAppVersion: '0.3.0',
    maxAppVersion: '0.3.0',
    recordFamilies: Object.fromEntries(
      WORKSPACE_SCHEMA_FAMILIES.map((name) => [
        name,
        { presentSchemaVersions: [1], allowedWriteSchemaVersions: [1] },
      ]),
    ),
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
async function publish(value: unknown) {
  await env.withSecurityRulesDisabled((c) =>
    setDoc(doc(c.firestore(), 'runtime/compatibility'), value),
  );
}
function client(
  authTime = now(),
  provider = 'google.com',
  subject = uid,
  token: Record<string, unknown> = {},
) {
  return env
    .authenticatedContext(subject, {
      auth_time: authTime,
      firebase: {
        sign_in_provider: provider,
        identities: { [provider]: ['synthetic-subject'] },
      },
      ...token,
    } as Parameters<RulesTestEnvironment['authenticatedContext']>[1])
    .firestore();
}
function request(authTime = now(), proofProvider = 'google.com') {
  return {
    schemaVersion: 1,
    inventoryVersion: 1,
    operatorPolicyVersion: 1,
    admissionRevision: 3,
    jobId: job,
    state: 'requested',
    requestedAt: serverTimestamp(),
    authTime,
    proofProvider,
    recordVersion: 1,
    updatedAt: serverTimestamp(),
  };
}
it.each(['google.com', 'microsoft.com'])(
  'admits recent signed %s claims without email/profile',
  async (provider) => {
    const at = now(),
      db = client(at, provider);
    await assertSucceeds(setDoc(doc(db, controlPath), request(at, provider)));
    const snapshot = await getDoc(doc(db, controlPath));
    expect(snapshot.data()?.requestedAt).toBeInstanceOf(Timestamp);
    expect(snapshot.data()?.authTime).toBe(at);
  },
);
it.each([0, 2, 3])(
  'requires serverRelease3 independently of revision%s',
  async (revision) => {
    await publish({ ...policy(), revision, serverRelease: 2 });
    const at = now();
    await assertFails(setDoc(doc(client(at), controlPath), request(at)));
  },
);
it('requires revision3 independently of server release', async () => {
  await publish({ ...policy(), revision: 2 });
  const at = now();
  await assertFails(setDoc(doc(client(at), controlPath), request(at)));
});
it.each([
  { environmentId: 'another-project' },
  { contractFormatVersion: 2 },
  {
    recordFamilies: {
      accountDeletion: {
        presentSchemaVersions: [1],
        allowedWriteSchemaVersions: [2],
      },
    },
  },
  {
    recordFamilies: {
      accountDeletion: {
        presentSchemaVersions: [2],
        allowedWriteSchemaVersions: [1],
      },
    },
  },
])('rejects mismatched policy %j', async (patch) => {
  await publish({ ...policy(), ...patch });
  const at = now();
  await assertFails(setDoc(doc(client(at), controlPath), request(at)));
});
it.each([-301, 60])(
  'rejects expired or future signed authentication offset %s',
  async (offset) => {
    const at = now() + offset;
    await assertFails(setDoc(doc(client(at), controlPath), request(at)));
  },
);
it('admits proof near the inclusive expiration boundary', async () => {
  const at = now() - 298;
  await assertSucceeds(setDoc(doc(client(at), controlPath), request(at)));
});
it.each([
  { firebase: { sign_in_provider: 'google.com', identities: {} } },
  {
    firebase: {
      sign_in_provider: 'google.com',
      identities: { 'google.com': [] },
    },
  },
  {
    firebase: {
      sign_in_provider: 'google.com',
      identities: { 'google.com': 'forged' },
    },
  },
  {
    firebase: {
      sign_in_provider: 'microsoft.com',
      identities: { 'google.com': ['subject'] },
    },
  },
  { auth_time: 'recent' },
])('rejects missing or mismatched trusted claims %j', async (token) => {
  const at = now();
  await assertFails(
    setDoc(doc(client(at, 'google.com', uid, token), controlPath), request(at)),
  );
});
it.each(['password', 'anonymous', 'custom'])(
  'rejects unsupported provider %s',
  async (provider) => {
    const at = now();
    await assertFails(
      setDoc(doc(client(at, provider), controlPath), request(at, provider)),
    );
  },
);
it.each([
  { schemaVersion: 2 },
  { inventoryVersion: 2 },
  { operatorPolicyVersion: 2 },
  { admissionRevision: 4 },
  { jobId: 'not-a-job' },
  { jobId: '11111111-1111-1111-8111-111111111111' },
  { state: 'awaiting_retirement' },
  { recordVersion: 2 },
  { proofProvider: 'microsoft.com' },
  { authTime: 1 },
  { requestedAt: Timestamp.fromMillis(0) },
  { updatedAt: Timestamp.fromMillis(0) },
  { leaseGeneration: 1 },
  { pauseCode: 'unavailable' },
  { email: 'private@example.invalid' },
])('rejects forged/unknown request fields %j', async (patch) => {
  const at = now();
  await assertFails(
    setDoc(doc(client(at), controlPath), { ...request(at), ...patch }),
  );
});
it.each(['jobId', 'operatorPolicyVersion', 'updatedAt', 'authTime'])(
  'rejects missing initial field %s',
  async (field) => {
    const at = now(),
      data = request(at) as Record<string, unknown>;
    delete data[field];
    await assertFails(setDoc(doc(client(at), controlPath), data));
  },
);
it('denies anonymous and cross-UID intent and status access', async () => {
  const at = now();
  await assertFails(
    setDoc(
      doc(env.unauthenticatedContext().firestore(), controlPath),
      request(at),
    ),
  );
  const foreign = client(at, 'google.com', 'new-account');
  await assertFails(setDoc(doc(foreign, controlPath), request(at)));
  await assertFails(getDoc(doc(foreign, controlPath)));
});
it('allows only owner get and denies browser progress, replacement and retirement', async () => {
  const at = now(),
    db = client(at);
  await setDoc(doc(db, controlPath), request(at));
  await assertSucceeds(getDoc(doc(db, controlPath)));
  await assertFails(getDocs(collection(db, 'accountDeletion')));
  await assertFails(updateDoc(doc(db, controlPath), { state: 'cleaning' }));
  await assertFails(setDoc(doc(db, controlPath), request(at)));
  await assertFails(deleteDoc(doc(db, controlPath)));
});
it('atomically rejects a combined intent/provisioning batch', async () => {
  const at = now(),
    db = client(at),
    batch = writeBatch(db);
  for (const item of stageWrites(uid, 0))
    batch.set(doc(db, item.path), item.data);
  batch.set(doc(db, controlPath), request(at));
  await assertFails(batch.commit());
  expect((await getDoc(doc(db, controlPath))).exists()).toBe(false);
  expect(
    (await getDoc(doc(db, `users/${uid}/initialization/workspace`))).exists(),
  ).toBe(false);
});
it('fences old UID A while distinct UID B can initialize', async () => {
  const at = now(),
    dbA = client(at),
    dbB = client(at, 'google.com', 'new-account');
  await setDoc(doc(dbA, controlPath), request(at));
  const old = writeBatch(dbA);
  for (const item of stageWrites(uid, 0))
    old.set(doc(dbA, item.path), item.data);
  await assertFails(old.commit());
  const fresh = writeBatch(dbB);
  for (const item of stageWrites('new-account', 0))
    fresh.set(doc(dbB, item.path), item.data);
  await assertSucceeds(fresh.commit());
  await assertFails(getDoc(doc(dbB, controlPath)));
});
