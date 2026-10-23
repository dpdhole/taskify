import { beforeAll, afterAll, it, expect } from 'vitest';
import fs from 'node:fs';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import { createContractReader } from '../../src/infrastructure/firebase/contract-reader';
import { createCompatibilityGate } from '../../src/application/compatibility-gate';
import { capabilities, contract } from '../support/compatibility-fixtures';
let cloud: RulesTestEnvironment, fixture: RulesTestEnvironment;
async function waitFor(check: () => boolean) {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > 10000)
      throw Error('Expected compatibility state not reached');
    await new Promise((r) => setTimeout(r, 25));
  }
}
beforeAll(async () => {
  if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080')
    throw Error('Checked loopback runner required');
  cloud = await initializeTestEnvironment({
    projectId: 'demo-taskify-compatibility',
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: fs.readFileSync('firestore.compatibility.rules', 'utf8'),
    },
  });
  fixture = await initializeTestEnvironment({
    projectId: 'demo-taskify-compatibility-writes',
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: fs.readFileSync('tests/support/compatibility-write.rules', 'utf8'),
    },
  });
  await cloud.clearFirestore();
  await fixture.clearFirestore();
  await cloud.withSecurityRulesDisabled((c) =>
    setDoc(doc(c.firestore(), 'runtime/compatibility'), contract()),
  );
  await fixture.withSecurityRulesDisabled((c) =>
    setDoc(doc(c.firestore(), 'runtime/compatibility'), contract()),
  );
});
afterAll(async () => {
  await cloud?.cleanup();
  await fixture?.cleanup();
});
it('cloud policy grants only exact contract get, including for bypassing authenticated fixtures', async () => {
  const db = cloud.unauthenticatedContext().firestore();
  expect((await getDoc(doc(db, 'runtime/compatibility'))).data()).toEqual(
    contract(),
  );
  for (const context of [
    cloud.unauthenticatedContext(),
    cloud.authenticatedContext('fixture-owner'),
  ]) {
    const current = context.firestore();
    await assertFails(getDocs(collection(current, 'runtime')));
    await assertFails(
      setDoc(doc(current, 'runtime/compatibility'), contract({ revision: 2 })),
    );
    await assertFails(getDoc(doc(current, 'users/private')));
    await assertFails(
      setDoc(doc(current, 'compatibilityProbe/fixture'), {
        schemaVersion: 1,
        value: 'forbidden',
      }),
    );
  }
});
it('emulator-only write policy rejects unauthenticated and invalid schemas when gate is bypassed', async () => {
  const db = fixture.authenticatedContext('fixture-owner').firestore();
  await assertSucceeds(
    setDoc(doc(db, 'compatibilityProbe/fixture'), {
      schemaVersion: 1,
      value: 'synthetic',
    }),
  );
  await assertFails(
    setDoc(doc(db, 'compatibilityProbe/fixture'), {
      schemaVersion: 2,
      value: 'wrong schema',
    }),
  );
  await assertFails(
    setDoc(doc(db, 'compatibilityProbe/fixture'), {
      schemaVersion: 1,
      value: 'extra',
      owner: 'injected',
    }),
  );
  await assertFails(
    setDoc(
      doc(
        fixture.unauthenticatedContext().firestore(),
        'compatibilityProbe/fixture',
      ),
      { schemaVersion: 1, value: 'unowned' },
    ),
  );
  await fixture.withSecurityRulesDisabled((c) =>
    setDoc(
      doc(c.firestore(), 'runtime/compatibility'),
      contract({
        revision: 2,
        recordFamilies: {
          compatibilityProbe: {
            presentSchemaVersions: [1, 2],
            allowedWriteSchemaVersions: [2],
          },
        },
      }),
    ),
  );
  await assertFails(
    setDoc(doc(db, 'compatibilityProbe/fixture'), {
      schemaVersion: 1,
      value: 'retired writer',
    }),
  );
});
it('real SDK reader verifies server state, observes changes and disposes one listener', async () => {
  const adapter = createContractReader({
    projectId: 'demo-taskify-compatibility',
    apiKey: 'demo-only',
    emulator: { host: '127.0.0.1', port: 8080 },
  });
  const gate = createCompatibilityGate(adapter.reader, capabilities, {
    schedule(fn, ms) {
      const timer = setTimeout(fn, ms);
      return () => clearTimeout(timer);
    },
  });
  try {
    gate.start();
    await waitFor(() => gate.getState().status === 'ready');
    expect(adapter.stats.activeListeners).toBe(1);
    expect(adapter.stats.serverReadRequests).toBe(1);
    await cloud.withSecurityRulesDisabled((c) =>
      setDoc(
        doc(c.firestore(), 'runtime/compatibility'),
        contract({
          revision: 2,
          minAppVersion: '0.2.0',
          maxAppVersion: '0.2.0',
        }),
      ),
    );
    await waitFor(() => gate.getState().reason === 'client-too-old');
    gate.suspend('offline');
    expect(adapter.stats.activeListeners).toBe(0);
    await cloud.withSecurityRulesDisabled((c) =>
      setDoc(
        doc(c.firestore(), 'runtime/compatibility'),
        contract({ revision: 3 }),
      ),
    );
    gate.recheck('reconnect');
    await waitFor(
      () =>
        gate.getState().status === 'ready' && gate.getState().revision === 3,
    );
    expect(adapter.stats.activeListeners).toBe(1);
    expect(adapter.stats.serverReadRequests).toBe(2);
    expect(adapter.stats.serverSnapshots).toBeGreaterThan(0);
  } finally {
    gate.dispose();
    expect(adapter.stats.activeListeners).toBe(0);
    await adapter.dispose();
  }
});
