import { initializeApp, deleteApp } from 'firebase/app';
import {
  connectFirestoreEmulator,
  doc,
  getFirestore,
  onSnapshot,
  terminate,
} from 'firebase/firestore';
import type { ProbeReader } from '../../application/probe-session';
import { decodeLocalConfig } from './local-config';
export function createFirebaseProbe(rawConfig: unknown) {
  const config = decodeLocalConfig(rawConfig);
  const app = initializeApp(
    { projectId: config.projectId, apiKey: 'demo-only' },
    'foundation-' + crypto.randomUUID(),
  );
  const db = getFirestore(app);
  connectFirestoreEmulator(db, config.host, config.firestorePort);
  const reader: ProbeReader = {
    watch(next, error) {
      return onSnapshot(
        doc(db, 'foundationProbe/status'),
        { includeMetadataChanges: true },
        (snapshot) => {
          if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites)
            return;
          next(snapshot.exists() ? snapshot.data() : null);
        },
        error,
      );
    },
  };
  return {
    reader,
    async dispose() {
      await terminate(db);
      await deleteApp(app);
    },
  };
}
