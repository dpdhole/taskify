import {
  applicationDefault,
  deleteApp,
  initializeApp,
} from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import {
  FieldValue,
  Firestore,
  getFirestore,
  Timestamp,
} from 'firebase-admin/firestore';
import type { DocumentSnapshot } from 'firebase-admin/firestore';
import type { OperatorPort, Snapshot, Target } from './operator';
import { OperatorError, validateTarget } from './operator';
import { decodeContract } from '../../src/domain/compatibility';

function normalize(value: unknown): unknown {
  if (value instanceof Timestamp)
    return { seconds: value.seconds, nanoseconds: value.nanoseconds };
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalize(item)]),
    );
  return value;
}
function encode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(encode);
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if (
      Object.keys(v).length === 2 &&
      typeof v.seconds === 'number' &&
      typeof v.nanoseconds === 'number'
    )
      return new Timestamp(v.seconds, v.nanoseconds);
    return Object.fromEntries(
      Object.entries(v).map(([key, item]) => [key, encode(item)]),
    );
  }
  return value;
}
function snapshot(s: DocumentSnapshot): Snapshot {
  return {
    exists: s.exists,
    data: normalize(s.data()),
    readTime: {
      seconds: s.readTime.seconds,
      nanoseconds: s.readTime.nanoseconds,
    },
  };
}
export function createFirebaseOperatorPort(target: Target, emulator = false) {
  validateTarget(target);
  const fire = process.env.FIRESTORE_EMULATOR_HOST,
    auth = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (
    emulator
      ? fire !== '127.0.0.1:8080' || auth !== '127.0.0.1:9099'
      : Boolean(fire || auth)
  )
    throw new OperatorError('invalid-target');
  if (
    process.env.FIREBASE_DATABASE_EMULATOR_HOST ||
    process.env.FIRESTORE_DATABASE_ID ||
    process.env.GOOGLE_CLOUD_QUOTA_PROJECT
  )
    throw new OperatorError('invalid-target');
  // Loopback mode must never probe ADC/metadata services for credentials.
  if (emulator) process.env.METADATA_SERVER_DETECTION = 'none';
  const credential = emulator
    ? {
        getAccessToken: async () => ({
          access_token: 'owner',
          expires_in: 3600,
        }),
      }
    : applicationDefault();
  const app = initializeApp(
    { projectId: target.project, ...(credential ? { credential } : {}) },
    `deletion-${crypto.randomUUID()}`,
  );
  const db = emulator
    ? new Firestore({
        projectId: target.project,
        host: '127.0.0.1:8080',
        ssl: false,
      })
    : getFirestore(app);
  const authClient = getAuth(app);
  const port: OperatorPort = {
    async verifyProject(t) {
      validateTarget(t);
      if (
        t.project !== target.project ||
        t.projectNumber !== target.projectNumber
      )
        throw new OperatorError('invalid-target');
      if (!emulator) {
        const token = await credential!.getAccessToken();
        const response = await fetch(
          `https://cloudresourcemanager.googleapis.com/v3/projects/${t.projectNumber}`,
          {
            headers: { Authorization: `Bearer ${token.access_token}` },
            signal: AbortSignal.timeout(15000),
          },
        );
        if (!response.ok) throw new OperatorError('invalid-target');
        const project = (await response.json()) as Record<string, unknown>;
        if (
          project.name !== `projects/${t.projectNumber}` ||
          project.projectId !== t.project ||
          project.state !== 'ACTIVE'
        )
          throw new OperatorError('invalid-target');
      }
      const c = decodeContract(
        (await db.doc('runtime/compatibility').get()).data(),
      );
      if (
        c.environmentId !== t.project ||
        c.revision < 3 ||
        c.serverRelease < 3 ||
        c.recordFamilies.accountDeletion?.presentSchemaVersions.some(
          (v) => v !== 1,
        ) ||
        !c.recordFamilies.accountDeletion?.allowedWriteSchemaVersions.includes(
          1,
        )
      )
        throw new OperatorError('invalid-target');
    },
    get: async (path) => snapshot(await db.doc(path).get()),
    collections: async (path) =>
      (await db.doc(path).listCollections()).map((ref) => ref.path),
    documents: async (path) =>
      (await db.collection(path).listDocuments()).map((ref) => ref.path),
    async auth(uid) {
      try {
        const user = await authClient.getUser(uid);
        const at = Timestamp.fromDate(new Date(user.metadata.creationTime));
        return {
          uid: user.uid,
          createdAt: { seconds: at.seconds, nanoseconds: at.nanoseconds },
        };
      } catch (error) {
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'auth/user-not-found'
        )
          return null;
        throw error;
      }
    },
    async deleteAuth(uid, beforeSend) {
      if (uid !== target.uid) throw new OperatorError('invalid-target');
      const token = await credential.getAccessToken();
      // Refreshing credentials can take time; recheck ownership after it settles.
      await beforeSend();
      const base = emulator
        ? 'http://127.0.0.1:9099/identitytoolkit.googleapis.com'
        : 'https://identitytoolkit.googleapis.com';
      // fetch does not retry this request; forbid redirects and bound the operation.
      const response = await fetch(
        `${base}/v1/projects/${target.project}/accounts:delete`,
        {
          method: 'POST',
          redirect: 'error',
          signal: AbortSignal.timeout(60000),
          headers: {
            Authorization: `Bearer ${token.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ localId: uid }),
        },
      );
      if (!response.ok) throw new OperatorError('auth-uncertain');
      await response.body?.cancel();
    },
    transaction: (work) =>
      db.runTransaction(
        (tx) =>
          work({
            get: async (path) => snapshot(await tx.get(db.doc(path))),
            delete: (path) => {
              tx.delete(db.doc(path));
            },
            control(path, before, after) {
              const body = encode(after) as Record<string, unknown>;
              body.updatedAt = FieldValue.serverTimestamp();
              if (!before.dataVerifiedAt && after.dataVerifiedAt)
                body.dataVerifiedAt = FieldValue.serverTimestamp();
              if (!before.authAbsentObservedAt && after.authAbsentObservedAt)
                body.authAbsentObservedAt = FieldValue.serverTimestamp();
              tx.set(db.doc(path), body);
            },
          }),
        { maxAttempts: 5 },
      ),
  };
  return {
    port,
    close: async () => {
      await db.terminate();
      await deleteApp(app);
    },
  };
}
