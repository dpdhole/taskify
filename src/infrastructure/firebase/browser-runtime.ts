import { createWorkspaceAdapter } from './workspace-adapter';
import { deleteApp } from 'firebase/app';
import {
  initializeFirestore,
  memoryLocalCache,
  terminate,
} from 'firebase/firestore';
import { createBrowserClient } from './browser-client';
import { createAuthAdapter } from './auth-adapter';
import { createContractReaderForDatabase } from './contract-reader';
export function createBrowserRuntime(raw: unknown, hostname: string) {
  const app = createBrowserClient(raw, hostname);
  const db = initializeFirestore(app, { localCache: memoryLocalCache() });
  const contracts = createContractReaderForDatabase(db);
  const auth = createAuthAdapter(app);
  const workspace = createWorkspaceAdapter(db);
  let disposed = false;
  return {
    contracts,
    auth,
    workspace,
    async dispose() {
      if (disposed) return;
      disposed = true;
      workspace.dispose();
      auth.dispose();
      await terminate(db);
      await deleteApp(app);
    },
  };
}
