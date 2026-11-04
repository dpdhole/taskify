import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';
import fs from 'node:fs';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  memoryLocalCache,
  terminate,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { createWorkspaceAdapter } from '../../src/infrastructure/firebase/workspace-adapter';
import { workspaceStages } from '../../src/domain/workspace-stages';
import { WORKSPACE_SCHEMA_FAMILIES } from '../../src/domain/workspace-seeds';
import { contract } from '../support/compatibility-fixtures';
import type {
  WorkspaceInitialInput,
  WorkspacePort,
} from '../../src/application/workspace-port';
let env: RulesTestEnvironment;
const projectId = 'demo-taskify-workspace-adapter',
  uid = 'adapter-owner';
const cleanups: (() => Promise<void>)[] = [];
let sequence = 0;
beforeAll(async () => {
  if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080')
    throw Error('Loopback emulator required');
  env = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: fs.readFileSync('firestore.workspace.rules', 'utf8'),
    },
  });
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled((c) =>
    setDoc(
      doc(c.firestore(), 'runtime/compatibility'),
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
      }),
    ),
  );
});
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
});
afterAll(async () => {
  await env?.cleanup();
});
function client(actor = uid) {
  const app = initializeApp(
    { projectId, apiKey: 'synthetic-key', appId: 'synthetic-app' },
    'workspace-adapter-' + sequence++,
  );
  const db = initializeFirestore(app, { localCache: memoryLocalCache() });
  connectFirestoreEmulator(db, '127.0.0.1', 8080, {
    mockUserToken: { sub: actor },
  });
  const port = createWorkspaceAdapter(db);
  cleanups.push(async () => {
    port.dispose();
    await terminate(db);
    await deleteApp(app);
  });
  return { db, port };
}
async function run(
  port: WorkspacePort,
  input: WorkspaceInitialInput = {
    timezone: 'Asia/Kolkata',
    profile: { displayName: 'Captured once' },
  },
) {
  const current = () => true;
  const state = await port.inspect(uid, current);
  if (state.complete) return state;
  for (let index = state.nextStage; index < workspaceStages.length; index++)
    await port.stage(uid, index, input, current);
  await port.finalize(uid, current);
  return port.inspect(uid, current);
}
it('provisions through the actual admitted transaction adapter and verifies server state', async () => {
  const { port } = client();
  const result = await run(port);
  expect(result).toMatchObject({
    complete: true,
    nextStage: 24,
    timezone: 'Asia/Kolkata',
    profile: { displayName: 'Captured once' },
  });
  expect(
    (
      await run(port, {
        timezone: 'UTC',
        profile: { displayName: 'Do not overwrite' },
      })
    ).profile?.displayName,
  ).toBe('Captured once');
}, 60000);
it('resumes an interrupted prefix without needing a valid new timezone or replacing initial values', async () => {
  const { port } = client();
  await port.stage(
    uid,
    0,
    { timezone: 'Asia/Kolkata', profile: { displayName: 'Initial' } },
    () => true,
  );
  await port.stage(uid, 1, {}, () => true);
  expect(await port.inspect(uid, () => true)).toMatchObject({
    complete: false,
    nextStage: 2,
  });
  await port.stage(uid, 0, { timezone: 'Invalid/Zone' }, () => true);
  const result = await run(port, {});
  expect(result.timezone).toBe('Asia/Kolkata');
  expect(result.profile?.displayName).toBe('Initial');
}, 60000);
it('same-UID clients with different proposals converge on first committed values', async () => {
  const a = client(),
    b = client();
  const proposals = [
    { timezone: 'Asia/Kolkata', profile: { displayName: 'A' } },
    { timezone: 'America/New_York', profile: { displayName: 'B' } },
  ];
  await Promise.all([
    a.port.stage(uid, 0, proposals[0]!, () => true),
    b.port.stage(uid, 0, proposals[1]!, () => true),
  ]);
  const results = await Promise.all([
    run(a.port, proposals[0]),
    run(b.port, proposals[1]),
  ]);
  expect(results[0]).toEqual(results[1]);
  expect(['A', 'B']).toContain(results[0]!.profile?.displayName);
}, 60000);
it('reconciles inspection while another client finalizes the completed prefix', async () => {
  const a = client(),
    b = client();
  for (let index = 0; index < workspaceStages.length; index++)
    await a.port.stage(uid, index, { timezone: 'UTC' }, () => true);
  const [observed] = await Promise.all([
    b.port.inspect(uid, () => true),
    a.port.finalize(uid, () => true),
  ]);
  expect(observed.nextStage).toBe(24);
  expect(await b.port.inspect(uid, () => true)).toMatchObject({
    complete: true,
    timezone: 'UTC',
  });
}, 60000);
it('reconciles an already committed stage after an acknowledgement is lost', async () => {
  const { port } = client();
  await port.stage(uid, 0, { timezone: 'UTC' }, () => true);
  expect((await port.inspect(uid, () => true)).nextStage).toBe(1);
  await port.stage(
    uid,
    0,
    { timezone: 'Invalid/Zone', profile: { displayName: 'x'.repeat(2000) } },
    () => true,
  );
  expect((await port.inspect(uid, () => true)).nextStage).toBe(1);
});
it('rejects invalid first-use input before committing any initialization records', async () => {
  const { port, db } = client();
  await expect(port.stage(uid, 0, {}, () => true)).rejects.toMatchObject({
    reason: 'timezone-required',
  });
  await expect(
    port.stage(
      uid,
      0,
      { timezone: 'UTC', profile: { displayName: 'x'.repeat(1025) } },
      () => true,
    ),
  ).rejects.toMatchObject({ reason: 'profile-invalid' });
  expect(
    (await getDoc(doc(db, `users/${uid}/initialization/workspace`))).exists(),
  ).toBe(false);
});
it('checks admission again after asynchronous reads and before transaction writes', async () => {
  const { port, db } = client();
  let count = 0;
  await expect(
    port.stage(uid, 0, { timezone: 'UTC' }, () => ++count < 7),
  ).rejects.toMatchObject({ reason: 'revoked' });
  expect(
    (await getDoc(doc(db, `users/${uid}/initialization/workspace`))).exists(),
  ).toBe(false);
});
it('blocks root deletion fences even when their schema/state is unknown', async () => {
  const { port } = client();
  await env.withSecurityRulesDisabled((c) =>
    setDoc(doc(c.firestore(), `accountDeletion/${uid}`), { schemaVersion: 99 }),
  );
  await expect(port.inspect(uid, () => true)).rejects.toMatchObject({
    reason: 'fenced',
  });
  await expect(
    port.stage(uid, 0, { timezone: 'UTC' }, () => true),
  ).rejects.toMatchObject({ reason: 'fenced' });
});
it('does not reset malformed required records or corrupt completed-stage content', async () => {
  const { port } = client();
  await port.stage(uid, 0, { timezone: 'UTC' }, () => true);
  await port.stage(uid, 1, {}, () => true);
  await env.withSecurityRulesDisabled((c) =>
    updateDoc(doc(c.firestore(), `users/${uid}/categories/family`), {
      name: 'Changed behind Rules',
    }),
  );
  await expect(port.inspect(uid, () => true)).rejects.toMatchObject({
    reason: 'inconsistent',
  });
});
it('does not recreate an intentionally deleted ordinary View after completed initialization', async () => {
  const { port } = client();
  await run(port);
  await env.withSecurityRulesDisabled((c) =>
    deleteDoc(doc(c.firestore(), `users/${uid}/views/focus`)),
  );
  expect((await run(port)).complete).toBe(true);
  await env.withSecurityRulesDisabled(async (c) => {
    expect(
      (await getDoc(doc(c.firestore(), `users/${uid}/views/focus`))).exists(),
    ).toBe(false);
  });
}, 60000);
it('rejects malformed completed required records and isolates foreign UID paths', async () => {
  const { port } = client();
  await run(port);
  await env.withSecurityRulesDisabled((c) =>
    updateDoc(doc(c.firestore(), `users/${uid}/settings/main`), {
      schemaVersion: 99,
    }),
  );
  await expect(port.inspect(uid, () => true)).rejects.toMatchObject({
    reason: 'inconsistent',
  });
  await expect(port.inspect('other-owner', () => true)).rejects.toBeDefined();
}, 60000);
it('delivers authoritative fence state and disposes subscriptions', async () => {
  const { port } = client();
  let exists: boolean | undefined;
  port.watchFence(
    uid,
    (value, authoritative) => {
      if (authoritative) exists = value;
    },
    () => {},
  );
  const wait = async (value: boolean) => {
    const end = Date.now() + 5000;
    while (exists !== value) {
      if (Date.now() > end) throw Error('Fence not observed');
      await new Promise((r) => setTimeout(r, 20));
    }
  };
  await wait(false);
  await env.withSecurityRulesDisabled((c) =>
    setDoc(doc(c.firestore(), `accountDeletion/${uid}`), {}),
  );
  await wait(true);
  port.dispose();
  await expect(port.inspect(uid, () => true)).rejects.toMatchObject({
    reason: 'revoked',
  });
});
