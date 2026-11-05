import {
  doc,
  getDocFromServer,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import type { Firestore, DocumentSnapshot } from 'firebase/firestore';
import { decodeAccountDeletion } from '../../domain/account-deletion';
import { decodeContract } from '../../domain/compatibility';
import { recordId } from '../../domain/workspace-validation';
import { DeletionError } from '../../application/account-deletion-port';
import type {
  DeletionRequestPort,
  DeletionStatus,
} from '../../application/account-deletion-port';
function normalize(v: unknown): unknown {
  if (v instanceof Timestamp)
    return { seconds: v.seconds, nanoseconds: v.nanoseconds };
  if (Array.isArray(v)) return v.map(normalize);
  if (v && typeof v === 'object')
    return Object.fromEntries(
      Object.entries(v).map(([k, x]) => [k, normalize(x)]),
    );
  return v;
}
function status(s: DocumentSnapshot): DeletionStatus {
  if (!s.exists()) return { exists: false };
  try {
    return {
      exists: true,
      control: decodeAccountDeletion(normalize(s.data())),
    };
  } catch {
    return { exists: true, control: null };
  }
}
export function createDeletionRequestAdapter(
  db: Firestore,
  storage = globalThis.sessionStorage,
): DeletionRequestPort {
  let disposed = false;
  const stops = new Set<() => void>();
  const reference = (uid: string) => {
    recordId(uid);
    return doc(db, `accountDeletion/${uid}`);
  };
  const key = (uid: string) =>
    `taskify:delete-intent:${db.app.options.projectId}:${uid}`;
  return {
    forget(uid) {
      try {
        storage?.removeItem(key(uid));
      } catch {
        /* Storage access cannot grant server authority. */
      }
    },
    hasPending(uid) {
      try {
        return Boolean(storage?.getItem(key(uid)));
      } catch {
        return true;
      }
    },
    async read(uid) {
      if (disposed) throw new DeletionError('revoked');
      try {
        const s = await getDocFromServer(reference(uid));
        if (disposed || s.metadata.fromCache || s.metadata.hasPendingWrites)
          throw Error();
        return status(s);
      } catch {
        throw new DeletionError('unavailable');
      }
    },
    async request(proof, revision, current) {
      const check = () => {
        if (disposed || !current()) throw new DeletionError('revoked');
      };
      check();
      try {
        if (!storage) throw new DeletionError('unsupported');
        storage.setItem(key(proof.uid), proof.jobId);
        await runTransaction(
          db,
          async (tx) => {
            check();
            const ref = reference(proof.uid),
              fence = await tx.get(ref);
            if (fence.exists()) return; // Existing job wins; never replace it.
            const policy = decodeContract(
              (await tx.get(doc(db, 'runtime/compatibility'))).data(),
            );
            if (
              policy.revision !== revision ||
              revision < 3 ||
              policy.serverRelease < 3 ||
              !policy.recordFamilies.accountDeletion?.allowedWriteSchemaVersions.includes(
                1,
              )
            )
              throw new DeletionError('unsupported');
            check();
            tx.set(ref, {
              schemaVersion: 1,
              inventoryVersion: 1,
              operatorPolicyVersion: 1,
              admissionRevision: revision,
              jobId: proof.jobId,
              state: 'requested',
              requestedAt: serverTimestamp(),
              authTime: proof.authTime,
              proofProvider: proof.provider,
              recordVersion: 1,
              updatedAt: serverTimestamp(),
            });
          },
          { maxAttempts: 5 },
        );
      } catch (error) {
        if (error instanceof DeletionError && error.reason === 'unsupported') {
          storage?.removeItem(key(proof.uid));
          throw error;
        }
        // A rejected acknowledgement is not evidence that no intent was committed.
        throw new DeletionError('uncertain');
      }
      check();
      try {
        const s = await getDocFromServer(reference(proof.uid));
        check();
        if (s.metadata.fromCache || s.metadata.hasPendingWrites)
          throw new DeletionError('uncertain');
        return status(s);
      } catch {
        throw new DeletionError('uncertain');
      }
    },
    watch(uid, next, error) {
      if (disposed) throw new DeletionError('revoked');
      const stop = onSnapshot(
        reference(uid),
        { includeMetadataChanges: true },
        (s) => {
          if (!disposed)
            next(
              status(s),
              !s.metadata.fromCache && !s.metadata.hasPendingWrites,
            );
        },
        () => {
          if (!disposed) error();
        },
      );
      stops.add(stop);
      return () => {
        stop();
        stops.delete(stop);
      };
    },
    dispose() {
      disposed = true;
      for (const stop of stops) stop();
      stops.clear();
    },
  };
}
