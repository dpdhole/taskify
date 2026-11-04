import { stageWrites } from '../support/workspace-write-fixtures';
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
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
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { WORKSPACE_SCHEMA_FAMILIES } from '../../src/domain/workspace-seeds';
import { contract } from '../support/compatibility-fixtures';
import { probeStages } from '../support/provisioning-stage-layout';
import { decodeFirestoreWorkspaceRecord } from '../../src/infrastructure/firebase/workspace-record-decoder';
let env: RulesTestEnvironment;
const uid = 'stage-owner';
const at = (kind: string, id: string) => `users/${uid}/${kind}/${id}`;
const hash = (key: string) =>
  createHash('sha256').update(key, 'utf8').digest('hex');
const guard = (kind: string, key: string) =>
  `users/${uid}/nameKeys/${kind}/keys/${hash(key)}`;
const receipt = () => ({
  schemaVersion: 1,
  templateVersion: 1,
  completedAt: serverTimestamp(),
});
const policy = () =>
  contract({
    environmentId: 'demo-taskify-provisioning-stage',
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
    throw Error('Loopback emulator runner required');
  env = await initializeTestEnvironment({
    projectId: 'demo-taskify-provisioning-stage',
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: fs.readFileSync(
        ['production', 'workspace'].includes(
          process.env.TASKIFY_PROVISIONING_POLICY ?? '',
        )
          ? 'firestore.workspace.rules'
          : 'tests/support/provisioning-stage-probe.rules',
        'utf8',
      ),
    },
  });
});
afterAll(async () => {
  await env?.cleanup();
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled((c) =>
    setDoc(doc(c.firestore(), 'runtime/compatibility'), policy()),
  );
});
function db() {
  return env.authenticatedContext(uid).firestore();
}
async function assertFamilyAbsent() {
  let exists = true;
  await env.withSecurityRulesDisabled(async (c) => {
    exists = (
      await getDoc(doc(c.firestore(), at('categories', 'family')))
    ).exists();
  });
  expect(exists).toBe(false);
}
function writes(index: number) {
  return stageWrites(uid, index);
}
function submit(
  client: ReturnType<typeof db>,
  list: ReturnType<typeof writes>,
) {
  const batch = writeBatch(client);
  for (const { path, data } of list) batch.set(doc(client, path), data);
  return batch.commit();
}
async function advance(client: ReturnType<typeof db>, count: number) {
  for (let i = 0; i < count; i++) {
    try {
      await submit(client, writes(i));
    } catch (error) {
      throw new Error('Probe stage rejected: ' + probeStages[i]!.id, {
        cause: error,
      });
    }
  }
}
const finish = (client: ReturnType<typeof db>) =>
  updateDoc(doc(client, at('initialization', 'workspace')), {
    status: 'complete',
    recordVersion: 2,
    updatedAt: serverTimestamp(),
    completedAt: serverTimestamp(),
  });
it('commits all twenty-four bounded stages and finalizes without reading all receipts at once', async () => {
  const client = db();
  await advance(client, probeStages.length);
  await assertSucceeds(finish(client));
  expect(
    (await getDoc(doc(client, at('initialization', 'workspace')))).data()
      ?.status,
  ).toBe('complete');
  expect(
    (await getDocs(collection(client, `users/${uid}/categories`))).size,
  ).toBe(12);
  expect(
    (await getDocs(collection(client, `users/${uid}/locations`))).size,
  ).toBe(10);
  expect((await getDocs(collection(client, `users/${uid}/views`))).size).toBe(
    7,
  );
  expect(
    (await getDocs(collection(client, `users/${uid}/initializationStages`)))
      .size,
  ).toBe(24);
  for (const [family, kind] of [
    ['category', 'categories'],
    ['location', 'locations'],
    ['view', 'views'],
    ['initializationStage', 'initializationStages'],
  ] as const) {
    const documents = await getDocs(collection(client, `users/${uid}/${kind}`));
    for (const snapshot of documents.docs)
      expect(
        decodeFirestoreWorkspaceRecord(uid, family, snapshot).schemaVersion,
      ).toBe(1);
  }
  for (const [family, kind, id] of [
    ['workspaceInitialization', 'initialization', 'workspace'],
    ['profile', 'profile', 'main'],
    ['settings', 'settings', 'main'],
  ] as const) {
    expect(
      decodeFirestoreWorkspaceRecord(
        uid,
        family,
        await getDoc(doc(client, at(kind, id))),
      ).schemaVersion,
    ).toBe(1);
  }
  for (const kind of ['categories', 'locations']) {
    const documents = await getDocs(
      collection(client, `users/${uid}/nameKeys/${kind}/keys`),
    );
    for (const snapshot of documents.docs)
      expect(
        decodeFirestoreWorkspaceRecord(uid, 'nameReservation', snapshot)
          .schemaVersion,
      ).toBe(1);
  }
});
it('denies a forged final receipt, skipped predecessor, or premature complete marker', async () => {
  const client = db();
  await submit(client, writes(0));
  await assertFails(
    setDoc(doc(client, at('initializationStages', 'views-07')), receipt()),
  );
  await assertFails(submit(client, writes(2)));
  await assertFails(finish(client));
  expect(
    (
      await getDoc(doc(client, at('initializationStages', 'views-07')))
    ).exists(),
  ).toBe(false);
});
it('requires every paired seed/guard and atomically rolls back missing-half submissions', async () => {
  const client = db();
  await submit(client, writes(0));
  const incomplete = writes(1).filter(
    (w) => w.path !== guard('categories', 'finance'),
  );
  await assertFails(submit(client, incomplete));
  await assertFamilyAbsent();
  expect(
    (
      await getDoc(doc(client, at('initializationStages', 'categories-01')))
    ).exists(),
  ).toBe(false);
});
it('rejects orphan record and guard writes without their stage receipt', async () => {
  const client = db();
  await submit(client, writes(0));
  await assertFails(
    submit(
      client,
      writes(1).filter((w) => !w.path.includes('/initializationStages/')),
    ),
  );
});
it('rejects altered seed content even when its guard and receipt are supplied', async () => {
  const client = db();
  await submit(client, writes(0));
  const data = writes(1);
  data[0]!.data.name = 'Forged';
  await assertFails(submit(client, data));
});
it('validates digest-to-key binding rather than accepting a caller-supplied hash', async () => {
  const client = db();
  await submit(client, writes(0));
  const data = writes(1);
  const g = data.find((w) => w.path === guard('categories', 'family'))!;
  g.path = g.path.replace(hash('family'), 'a'.repeat(64));
  await assertFails(submit(client, data));
});
it('allows only one competing whole-stage claim without resetting first-committed data', async () => {
  const a = db(),
    b = db();
  const results = await Promise.allSettled([
    submit(a, writes(0)),
    submit(b, writes(0)),
  ]);
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
  expect((await getDoc(doc(a, at('settings', 'main')))).data()?.timezone).toBe(
    'UTC',
  );
  expect(
    (await getDocs(collection(a, `users/${uid}/initializationStages`))).size,
  ).toBe(1);
});
it('keeps receipts immutable and denies client cleanup', async () => {
  const client = db();
  await submit(client, writes(0));
  const ref = doc(client, at('initializationStages', 'base'));
  await assertFails(updateDoc(ref, { templateVersion: 2 }));
  await assertFails(deleteDoc(ref));
});
it('fences base setup and cannot be cleared by the owner client', async () => {
  await env.withSecurityRulesDisabled((c) =>
    setDoc(doc(c.firestore(), `accountDeletion/${uid}`), {
      schemaVersion: 99,
      state: 'unknown',
    }),
  );
  const client = db();
  await assertFails(submit(client, writes(0)));
  expect((await getDoc(doc(client, `accountDeletion/${uid}`))).exists()).toBe(
    true,
  );
  await assertFails(deleteDoc(doc(client, `accountDeletion/${uid}`)));
});
it('fences named stage writes, reservations and receipts after committed base setup', async () => {
  const client = db();
  await submit(client, writes(0));
  await env.withSecurityRulesDisabled((c) =>
    setDoc(doc(c.firestore(), `accountDeletion/${uid}`), {}),
  );
  await assertFails(submit(client, writes(1)));
  await assertFamilyAbsent();
});
it('fences finalization even after all stage receipts exist', async () => {
  const client = db();
  await advance(client, probeStages.length);
  await env.withSecurityRulesDisabled((c) =>
    setDoc(doc(c.firestore(), `accountDeletion/${uid}`), {
      state: 'requested',
    }),
  );
  await assertFails(finish(client));
});
it('denies cross-UID/anonymous writes and owner-status disclosure to another UID', async () => {
  const foreign = env.authenticatedContext('other-owner').firestore(),
    anon = env.unauthenticatedContext().firestore();
  await assertFails(submit(foreign, writes(0)));
  await assertFails(submit(anon, writes(0)));
  await assertFails(getDoc(doc(foreign, `accountDeletion/${uid}`)));
});
it('blocks new named writes when their schema is not writable in authoritative policy', async () => {
  const client = db();
  await submit(client, writes(0));
  const changed = policy();
  changed.recordFamilies.category = {
    presentSchemaVersions: [1, 2],
    allowedWriteSchemaVersions: [2],
  };
  await env.withSecurityRulesDisabled((c) =>
    setDoc(doc(c.firestore(), 'runtime/compatibility'), changed),
  );
  await assertFails(submit(client, writes(1)));
});
it('does not permit reseeding or resetting records after initialization completes', async () => {
  const client = db();
  await advance(client, probeStages.length);
  await finish(client);
  await assertFails(submit(client, writes(0)));
  await assertFails(
    updateDoc(doc(client, at('categories', 'family')), { name: 'Reset' }),
  );
  await assertFails(finish(client));
});

it('allows one competing named-stage claimant without duplicate entities or reservations', async () => {
  const a = db(),
    b = db();
  await submit(a, writes(0));
  const results = await Promise.allSettled([
    submit(a, writes(1)),
    submit(b, writes(1)),
  ]);
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  expect((await getDocs(collection(a, `users/${uid}/categories`))).size).toBe(
    2,
  );
  expect(
    (await getDocs(collection(a, `users/${uid}/nameKeys/categories/keys`)))
      .size,
  ).toBe(2);
});
it('fences View seed creation as well as named stages', async () => {
  const client = db(),
    index = probeStages.findIndex((stage) => stage.kind === 'views');
  await advance(client, index);
  await env.withSecurityRulesDisabled((c) =>
    setDoc(doc(c.firestore(), `accountDeletion/${uid}`), {}),
  );
  await assertFails(submit(client, writes(index)));
});
it('rejects forged receipt schemas even with every required paired record present', async () => {
  const client = db();
  await submit(client, writes(0));
  const data = writes(1);
  data.at(-1)!.data.schemaVersion = 2;
  await assertFails(submit(client, data));
  await assertFamilyAbsent();
});
it('does not let clients release a committed reservation independently of its record', async () => {
  const client = db();
  await advance(client, 2);
  await assertFails(deleteDoc(doc(client, guard('categories', 'family'))));
  await assertFails(
    updateDoc(doc(client, guard('categories', 'family')), {
      entityId: 'finance',
    }),
  );
});
