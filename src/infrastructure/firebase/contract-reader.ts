import { initializeApp, deleteApp } from 'firebase/app';
import {
  connectFirestoreEmulator,
  doc,
  getDocFromServer,
  initializeFirestore,
  memoryLocalCache,
  onSnapshot,
  terminate,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { ContractReader } from '../../application/compatibility-gate';
export interface ContractConfig {
  projectId: string;
  apiKey?: string;
  appId?: string;
  emulator?: { host: '127.0.0.1'; port: number };
}
export function decodeContractConfig(raw: unknown): ContractConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    throw Error('Invalid Firebase configuration');
  const c = raw as Record<string, unknown>;
  if (
    typeof c.projectId !== 'string' ||
    (c.apiKey !== undefined &&
      (typeof c.apiKey !== 'string' || !c.apiKey.trim()))
  )
    throw Error('Invalid Firebase configuration');
  if (c.projectId.startsWith('demo-')) {
    const e = c.emulator as Record<string, unknown> | undefined;
    if (
      !e ||
      e.host !== '127.0.0.1' ||
      typeof e.port !== 'number' ||
      !Number.isInteger(e.port) ||
      e.port < 1024 ||
      e.port > 65535
    )
      throw Error('Demo configuration requires explicit loopback emulator');
    return {
      projectId: c.projectId,
      ...(typeof c.apiKey === 'string' ? { apiKey: c.apiKey } : {}),
      emulator: { host: '127.0.0.1', port: e.port },
    };
  }
  if (c.projectId !== 'taskify-dev-dpdhole' || c.emulator !== undefined)
    throw Error('Unexpected cloud target');
  if (
    c.appId !== undefined &&
    (typeof c.appId !== 'string' || !c.appId.startsWith('1:243252492098:web:'))
  )
    throw Error('Missing or mismatched Firebase Web App ID');
  return {
    projectId: c.projectId,
    ...(typeof c.apiKey === 'string' ? { apiKey: c.apiKey } : {}),
    ...(typeof c.appId === 'string' ? { appId: c.appId } : {}),
  };
}
export function createContractReader(raw: unknown) {
  const config = decodeContractConfig(raw);
  const app = initializeApp(
    {
      projectId: config.projectId,
      ...(config.apiKey ? { apiKey: config.apiKey } : {}),
      ...(config.appId ? { appId: config.appId } : {}),
    },
    'compatibility-' + crypto.randomUUID(),
  );
  const db = initializeFirestore(app, { localCache: memoryLocalCache() });
  if (config.emulator)
    connectFirestoreEmulator(db, config.emulator.host, config.emulator.port);
  const shared = createContractReaderForDatabase(db);
  return {
    ...shared,
    async dispose() {
      await terminate(db);
      await deleteApp(app);
    },
  };
}

/** The runtime owns the shared database; this adapter owns only its listeners. */
export function createContractReaderForDatabase(db: Firestore) {
  const reference = doc(db, 'runtime/compatibility');
  const stats = {
    serverReadRequests: 0,
    snapshots: 0,
    serverSnapshots: 0,
    activeListeners: 0,
  };
  const reader: ContractReader = {
    async readServer() {
      stats.serverReadRequests++;
      const s = await getDocFromServer(reference);
      return s.exists() ? s.data() : null;
    },
    watch(next, error) {
      stats.activeListeners++;
      const stop = onSnapshot(
        reference,
        { includeMetadataChanges: true },
        (s) => {
          stats.snapshots++;
          const authoritative =
            !s.metadata.fromCache && !s.metadata.hasPendingWrites;
          if (authoritative) stats.serverSnapshots++;
          next(s.exists() ? s.data() : null, authoritative);
        },
        () => error(),
      );
      let stopped = false;
      return () => {
        if (!stopped) {
          stopped = true;
          stats.activeListeners--;
          stop();
        }
      };
    },
  };
  return {
    reader,
    stats,
  };
}
