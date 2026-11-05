import { beforeAll, afterAll, expect, it } from 'vitest';
import {
  initializeApp,
  deleteApp,
} from '../../tools/account-deletion/node_modules/firebase-admin/lib/app/index.js';
import {
  Firestore,
  FieldValue,
} from '../../tools/account-deletion/node_modules/firebase-admin/lib/firestore/index.js';
import { getAuth } from '../../tools/account-deletion/node_modules/firebase-admin/lib/auth/index.js';
import { createFirebaseOperatorPort } from '../../tools/account-deletion/firebase-port';
import { createDeletionOperator } from '../../tools/account-deletion/operator';
import { createWorkspaceSeedPlan } from '../../src/domain/workspace-seeds';
import {
  compareDeletionTime,
  decodeAccountDeletion,
} from '../../src/domain/account-deletion';
import fs from 'node:fs';
const project = 'taskify-dev-dpdhole';
const appName = 'deletion-operator-fixture';
let app: ReturnType<typeof initializeApp>;
let db: Firestore;
beforeAll(async () => {
  if (
    process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080' ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9099'
  )
    throw Error('Loopback emulators required');
  app = initializeApp(
    {
      projectId: project,
      credential: {
        getAccessToken: async () => ({
          access_token: 'owner',
          expires_in: 3600,
        }),
      },
    },
    appName,
  );
  db = new Firestore({
    projectId: project,
    host: '127.0.0.1:8080',
    ssl: false,
  });
  const policy = JSON.parse(
    fs.readFileSync('config/workspace-compatibility.json', 'utf8'),
  ) as Record<string, unknown>;
  await db.doc('runtime/compatibility').set({
    ...policy,
    revision: 3,
    serverRelease: 3,
    minAppVersion: '0.3.0',
    maxAppVersion: '0.3.0',
  });
});
afterAll(async () => {
  if (app) {
    await db.terminate();
    await deleteApp(app);
  }
});
async function fixture(count = 1) {
  const uid = 'operator-' + crypto.randomUUID(),
    jobId = crypto.randomUUID();
  await getAuth(app).createUser({ uid });
  const fixtureDb = db,
    time = FieldValue.serverTimestamp();
  await db.doc(`accountDeletion/${uid}`).set({
    schemaVersion: 1,
    inventoryVersion: 1,
    operatorPolicyVersion: 1,
    admissionRevision: 3,
    jobId,
    state: 'requested',
    requestedAt: time,
    authTime: Math.floor(Date.now() / 1000),
    proofProvider: 'google.com',
    recordVersion: 1,
    updatedAt: time,
  });
  const { id, ...seed } = createWorkspaceSeedPlan().categories[0]!;
  const batch = fixtureDb.batch();
  for (let i = 0; i < count; i++)
    batch.set(db.doc(`users/${uid}/categories/${id}-${i}`), {
      ...seed,
      schemaVersion: 1,
      recordVersion: 1,
      createdAt: time,
      updatedAt: time,
    });
  batch.set(db.doc(`users/${uid}/nameKeys/categories/keys/${'a'.repeat(64)}`), {
    schemaVersion: 1,
    nameKey: 'family',
    entityId: 'family',
    createdAt: time,
  });
  await batch.commit();
  const target = { uid, jobId, project, projectNumber: '243252492098' };
  const runtime = createFirebaseOperatorPort(target, true);
  return {
    uid,
    jobId,
    target,
    runtime,
    engine: createDeletionOperator(runtime.port, target, crypto.randomUUID()),
  };
}
it('uses real Admin SDK traversal to discover missing parents without writes', async () => {
  const f = await fixture();
  try {
    const result = await f.engine.inspect();
    expect(result.counts).toEqual({ category: 1, nameReservation: 1 });
    expect(result.authMatches).toBe(true);
    expect(
      (await db.doc(`accountDeletion/${f.uid}`).get()).data()?.recordVersion,
    ).toBe(1);
  } finally {
    await f.runtime.close();
  }
});
it('performs bounded cleanup with resolved server timestamps and retains Auth/control', async () => {
  const f = await fixture(205);
  try {
    await f.engine.cleanup('execute', f.jobId);
    const c = decodeAccountDeletion(
      (await f.runtime.port.get(`accountDeletion/${f.uid}`)).data,
    );
    expect(c.state).toBe('data_verified');
    expect(c.lease).toBeUndefined();
    expect(c.dataVerifiedAt).toBeDefined();
    expect(
      compareDeletionTime(c.dataVerifiedAt!, c.updatedAt),
    ).toBeLessThanOrEqual(0);
    expect((await f.engine.inspect()).counts).toEqual({});
    expect((await getAuth(app).getUser(f.uid)).uid).toBe(f.uid);
  } finally {
    await f.runtime.close();
  }
});
it('unknown nested families block before cleanup or lease acquisition', async () => {
  const f = await fixture();
  try {
    await db
      .doc(`users/${f.uid}/tasks/task/detail/description`)
      .set({ source: 'synthetic' });
    await expect(f.engine.cleanup('execute', f.jobId)).rejects.toThrow(
      'inventory-unsupported',
    );
    expect(
      (await db.doc(`accountDeletion/${f.uid}`).get()).data()?.recordVersion,
    ).toBe(1);
  } finally {
    await f.runtime.close();
  }
});
it('concurrent runs cannot both acquire the same active lease', async () => {
  const f = await fixture(2);
  try {
    const other = createDeletionOperator(
      f.runtime.port,
      f.target,
      crypto.randomUUID(),
    );
    const results = await Promise.allSettled([
      f.engine.cleanup('execute', f.jobId),
      other.cleanup('execute', f.jobId),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect((await f.engine.inspect()).counts).toEqual({});
    expect((await getAuth(app).getUser(f.uid)).uid).toBe(f.uid);
  } finally {
    await f.runtime.close();
  }
});
it('rejects cloud/emulator endpoint mixing before connection', () => {
  const target = {
    uid: 'synthetic',
    jobId: crypto.randomUUID(),
    project,
    projectNumber: '243252492098',
  };
  expect(() => createFirebaseOperatorPort(target, false)).toThrow(
    'invalid-target',
  );
});
