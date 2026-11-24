import { writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { recordId } from '../../src/domain/workspace-validation';

import { baseRecords } from './base-commit.mjs';
export { baseCommitRequest } from './base-commit.mjs';

export function baseReinitializationBatch(db: Firestore, uid: string) {
  recordId(uid);
  const batch = writeBatch(db);
  for (const record of baseRecords) {
    batch.set(doc(db, `users/${uid}/${record.suffix}`), {
      ...record.fields,
      ...Object.fromEntries(
        record.timestamps.map((field) => [field, serverTimestamp()]),
      ),
    });
  }
  return batch;
}
