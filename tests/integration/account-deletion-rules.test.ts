import {
  baseCommitRequest,
  baseReinitializationBatch,
} from '../../tools/t7-safety/probes';
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
import fs from 'node:fs';
import { createMockUserToken } from '@firebase/util';
import type { Firestore } from 'firebase/firestore';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import {
  collection,
  disableNetwork,
  enableNetwork,
  deleteDoc,
  doc,
  getDoc,
  getDocFromCache,
  getDocs,
  runTransaction,
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

it('T7 base probe is admissible before fencing and offline recreation is denied after cleanup', async () => {
  const at = now();
  const db = client(at);
  await assertSucceeds(
    baseReinitializationBatch(db as unknown as Firestore, uid).commit(),
  );
  await assertSucceeds(setDoc(doc(db, controlPath), request(at)));
  await env.withSecurityRulesDisabled(async (c) => {
    for (const suffix of [
      'initialization/workspace',
      'profile/main',
      'settings/main',
      'initializationStages/base',
    ])
      await deleteDoc(doc(c.firestore(), `users/${uid}/${suffix}`));
  });
  await disableNetwork(db);
  const rejected = assertFails(
    baseReinitializationBatch(db as unknown as Firestore, uid).commit(),
  );
  await enableNetwork(db);
  await rejected;
  await env.withSecurityRulesDisabled(async (c) => {
    expect(
      (await getDoc(doc(c.firestore(), `users/${uid}/profile/main`))).exists(),
    ).toBe(false);
    expect((await getDoc(doc(c.firestore(), controlPath))).exists()).toBe(true);
  });
});

it('denies an admissible base write queued before the fence when it reconnects after admission', async () => {
  const at = now();
  const offline = client(at) as unknown as Firestore;
  const online = client(at);
  const baselineUid = 'unfenced-base-control';
  await assertSucceeds(
    baseReinitializationBatch(
      client(at, 'google.com', baselineUid) as unknown as Firestore,
      baselineUid,
    ).commit(),
  );
  await disableNetwork(offline);
  const outcome = expect(
    baseReinitializationBatch(offline, uid).commit(),
  ).rejects.toMatchObject({ code: 'permission-denied' });
  const initialization = `users/${uid}/initialization/workspace`;
  const pending = await getDocFromCache(doc(offline, initialization));
  expect(pending.exists()).toBe(true);
  expect(pending.metadata.hasPendingWrites).toBe(true);
  expect((await getDoc(doc(online, initialization))).exists()).toBe(false);
  expect((await getDoc(doc(online, controlPath))).exists()).toBe(false);
  await assertSucceeds(setDoc(doc(online, controlPath), request(at)));
  await enableNetwork(offline);
  await outcome;
  await env.withSecurityRulesDisabled(async (c) => {
    expect((await getDoc(doc(c.firestore(), initialization))).exists()).toBe(
      false,
    );
    expect((await getDoc(doc(c.firestore(), controlPath))).exists()).toBe(true);
  });
});

it('denies an initialization transaction that began before admission and commits after the fence', async () => {
  const at = now();
  const writer = client(at);
  const admission = client(at);
  const initialization = `users/${uid}/initialization/workspace`;
  let markRead!: () => void;
  let releaseCommit!: () => void;
  const readCompleted = new Promise<void>((resolve) => {
    markRead = resolve;
  });
  const fenceCommitted = new Promise<void>((resolve) => {
    releaseCommit = resolve;
  });
  const write = runTransaction(
    writer,
    async (tx) => {
      expect((await tx.get(doc(writer, initialization))).exists()).toBe(false);
      markRead();
      await fenceCommitted;
      for (const item of stageWrites(uid, 0))
        tx.set(doc(writer, item.path), item.data);
    },
    { maxAttempts: 1 },
  );
  const settled = write.then(
    () => null,
    (error: unknown) => error,
  );
  try {
    await Promise.race([
      readCompleted,
      settled.then(() => {
        throw Error('Transaction ended before its server read');
      }),
    ]);
    await assertSucceeds(setDoc(doc(admission, controlPath), request(at)));
  } finally {
    releaseCommit();
  }
  expect(await settled).toMatchObject({ code: 'permission-denied' });
  await env.withSecurityRulesDisabled(async (c) => {
    for (const item of stageWrites(uid, 0))
      expect((await getDoc(doc(c.firestore(), item.path))).exists()).toBe(
        false,
      );
    expect((await getDoc(doc(c.firestore(), controlPath))).exists()).toBe(true);
  });
});

it('retains a base batch committed before admission for operator discovery', async () => {
  const at = now();
  const writer = client(at) as unknown as Firestore;
  await assertSucceeds(baseReinitializationBatch(writer, uid).commit());
  const admission = client(at);
  await assertSucceeds(setDoc(doc(admission, controlPath), request(at)));
  await assertFails(getDoc(doc(writer, `users/${uid}/profile/main`)));
  await env.withSecurityRulesDisabled(async (c) => {
    for (const item of stageWrites(uid, 0))
      expect((await getDoc(doc(c.firestore(), item.path))).exists()).toBe(true);
    expect((await getDoc(doc(c.firestore(), controlPath))).exists()).toBe(true);
  });
});

it('models an absent fence: the old namespace needs authentication and the fresh UID remains independent', async () => {
  const at = now();
  const freshUid = 'fresh-after-retirement';
  const fresh = client(at, 'google.com', freshUid) as unknown as Firestore;
  const anonymous = env
    .unauthenticatedContext()
    .firestore() as unknown as Firestore;
  await assertSucceeds(baseReinitializationBatch(fresh, freshUid).commit());
  const profile = doc(fresh, `users/${freshUid}/profile/main`);
  const before = (await getDoc(profile)).data();
  await assertFails(baseReinitializationBatch(anonymous, uid).commit());
  await assertFails(baseReinitializationBatch(fresh, uid).commit());
  await env.withSecurityRulesDisabled(async (c) => {
    expect((await getDoc(doc(c.firestore(), controlPath))).exists()).toBe(
      false,
    );
    expect(
      (await getDoc(doc(c.firestore(), `users/${uid}/profile/main`))).exists(),
    ).toBe(false);
  });
  // Counterexample: a still-authenticated old UID could recreate records without a fence.
  const old = client(at) as unknown as Firestore;
  await assertSucceeds(baseReinitializationBatch(old, uid).commit());
  expect((await getDoc(profile)).data()).toEqual(before);
});

it.each([false, true])(
  'validates the live REST create batch with fence=%s',
  async (fenced) => {
    const at = now();
    if (fenced)
      await assertSucceeds(setDoc(doc(client(at), controlPath), request(at)));
    const token = createMockUserToken(
      {
        sub: uid,
        auth_time: at,
        firebase: {
          sign_in_provider: 'google.com',
          identities: { 'google.com': ['synthetic-subject'] },
        },
      },
      projectId,
    );
    const response = await fetch(
      `http://127.0.0.1:8080/v1/projects/${projectId}/databases/(default)/documents:commit`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(baseCommitRequest(projectId, uid)),
        signal: AbortSignal.timeout(10000),
      },
    );
    const result = await response.json();
    expect(response.status).toBe(fenced ? 403 : 200);
    if (fenced) expect(result.error.status).toBe('PERMISSION_DENIED');
    else expect(result.writeResults).toHaveLength(4);
  },
);
