import { beforeAll, afterAll, it, expect } from 'vitest';
import fs from 'node:fs';
import {
  initializeTestEnvironment,
  assertFails,
} from '@firebase/rules-unit-testing';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
let env: RulesTestEnvironment;
beforeAll(async () => {
  if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080')
    throw Error('Local emulator required');
  env = await initializeTestEnvironment({
    projectId: 'demo-taskify-foundation',
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: fs.readFileSync('tests/support/firestore.rules', 'utf8'),
    },
  });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'foundationProbe/status'), {
      message: 'Emulator connection verified',
      revision: 1,
    });
  });
});
afterAll(async () => {
  await env?.cleanup();
});
it('reads the synthetic document but denies browser writes, lists and unrelated data', async () => {
  const db = env.unauthenticatedContext().firestore();
  expect((await getDoc(doc(db, 'foundationProbe/status'))).data()).toEqual({
    message: 'Emulator connection verified',
    revision: 1,
  });
  await assertFails(
    setDoc(doc(db, 'foundationProbe/status'), {
      message: 'Forbidden',
      revision: 2,
    }),
  );
  await assertFails(getDocs(collection(db, 'foundationProbe')));
  await assertFails(getDoc(doc(db, 'users/owner')));
  expect(
    (await getDoc(doc(db, 'foundationProbe/status'))).data()?.revision,
  ).toBe(1);
});
it('does not grant writes to an authenticated fixture either', async () => {
  await assertFails(
    setDoc(
      doc(
        env.authenticatedContext('fixture').firestore(),
        'foundationProbe/status',
      ),
      { message: 'Forbidden', revision: 2 },
    ),
  );
});
it('serves the ordinary static build through local Hosting with SPA fallback', async () => {
  for (const route of ['/', '/direct-link']) {
    const response = await fetch('http://127.0.0.1:5000' + route);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('<title>Taskify</title>');
  }
});
it('runs the Auth emulator locally without validating a live provider', async () => {
  const response = await fetch(
    'http://127.0.0.1:9099/emulator/v1/projects/demo-taskify-foundation/config',
  );
  expect(response.ok).toBe(true);
});
