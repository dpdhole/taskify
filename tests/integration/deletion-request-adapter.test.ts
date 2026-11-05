import { beforeAll, beforeEach, afterAll, expect, it } from 'vitest';
import fs from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { createDeletionRequestAdapter } from '../../src/infrastructure/firebase/deletion-request-adapter';
import type { DeletionProof } from '../../src/application/account-deletion-port';
let env: RulesTestEnvironment;
const projectId = 'demo-taskify-deletion-request',
  uid = 'request-owner';
const jobId = '11111111-1111-4111-8111-111111111111';
class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}
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
  const policy = JSON.parse(
    fs.readFileSync('config/workspace-compatibility.json', 'utf8'),
  );
  await env.withSecurityRulesDisabled((c) =>
    setDoc(doc(c.firestore(), 'runtime/compatibility'), {
      ...policy,
      environmentId: projectId,
      revision: 3,
      serverRelease: 3,
    }),
  );
});
afterAll(async () => {
  await env?.cleanup();
});
function setup() {
  const authTime = Math.floor(Date.now() / 1000);
  const db = env
    .authenticatedContext(uid, {
      auth_time: authTime,
      firebase: {
        sign_in_provider: 'google.com',
        identities: { 'google.com': ['synthetic'] },
      },
    })
    .firestore();
  const storage = new MemoryStorage();
  const modular = (db as unknown as { _delegate: Firestore })._delegate;
  const adapter = createDeletionRequestAdapter(modular, storage);
  const proof: DeletionProof = { uid, jobId, provider: 'google.com', authTime };
  return { db: modular, adapter, storage, proof };
}
it('creates exact immutable intent and decodes server timestamps without changing workspace data', async () => {
  const f = setup();
  try {
    await env.withSecurityRulesDisabled((c) =>
      setDoc(doc(c.firestore(), `users/${uid}/profile/main`), {
        synthetic: true,
      }),
    );
    const result = await f.adapter.request(f.proof, 3, () => true);
    expect(result.exists).toBe(true);
    if (!result.exists) throw Error();
    expect(result.control).toMatchObject({
      jobId,
      authTime: f.proof.authTime,
      state: 'requested',
    });
    expect(result.control?.requestedAt).toEqual(result.control?.updatedAt);
    await env.withSecurityRulesDisabled(async (c) =>
      expect(
        (await getDoc(doc(c.firestore(), `users/${uid}/profile/main`))).data(),
      ).toEqual({ synthetic: true }),
    );
  } finally {
    f.adapter.dispose();
  }
});
it('reconciles duplicates and adopts an existing job without replacing it', async () => {
  const f = setup();
  try {
    await f.adapter.request(f.proof, 3, () => true);
    const result = await f.adapter.request(
      { ...f.proof, jobId: '22222222-2222-4222-8222-222222222222' },
      3,
      () => true,
    );
    expect(result.exists && result.control?.jobId).toBe(jobId);
  } finally {
    f.adapter.dispose();
  }
});
it('preserves a UID-bound submission marker across adapter recreation', async () => {
  const f = setup();
  try {
    await f.adapter.request(f.proof, 3, () => true);
    const restored = createDeletionRequestAdapter(f.db, f.storage);
    try {
      expect(restored.hasPending?.(uid)).toBe(true);
      expect(restored.hasPending?.('other')).toBe(false);
    } finally {
      restored.dispose();
    }
  } finally {
    f.adapter.dispose();
  }
});
it('unknown control formats remain present and block instead of decoding as absence', async () => {
  const f = setup();
  try {
    await env.withSecurityRulesDisabled((c) =>
      setDoc(doc(c.firestore(), `accountDeletion/${uid}`), {
        schemaVersion: 99,
        state: 'unknown',
      }),
    );
    expect(await f.adapter.read(uid)).toEqual({ exists: true, control: null });
  } finally {
    f.adapter.dispose();
  }
});
it('revoked admission cannot submit a request', async () => {
  const f = setup();
  try {
    await expect(
      f.adapter.request(f.proof, 3, () => false),
    ).rejects.toMatchObject({ reason: 'revoked' });
    expect(await f.adapter.read(uid)).toEqual({ exists: false });
    expect(f.adapter.hasPending?.(uid)).toBe(false);
  } finally {
    f.adapter.dispose();
  }
});
it('service-release drift blocks creation and cannot upgrade policy from the browser', async () => {
  const f = setup();
  try {
    await expect(
      f.adapter.request(f.proof, 4, () => true),
    ).rejects.toMatchObject({ reason: 'unsupported' });
    expect(await f.adapter.read(uid)).toEqual({ exists: false });
    expect(f.adapter.hasPending?.(uid)).toBe(false);
  } finally {
    f.adapter.dispose();
  }
});
it('server-confirmed status listener observes the accepted intent', async () => {
  const f = setup();
  let stop = () => {};
  try {
    const observed = new Promise<string>((resolve, reject) => {
      stop = f.adapter.watch(
        uid,
        (value, authoritative) => {
          if (authoritative && value.exists && value.control)
            resolve(value.control.jobId);
        },
        reject,
      );
    });
    await f.adapter.request(f.proof, 3, () => true);
    expect(await observed).toBe(jobId);
  } finally {
    stop();
    f.adapter.dispose();
  }
});
