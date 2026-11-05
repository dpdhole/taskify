import { createWorkspaceAdapter } from './workspace-adapter';
import { createDeletionRequestAdapter } from './deletion-request-adapter';
import { createDeletionProofAdapter } from './deletion-proof-adapter';
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
  const deletionRequests = createDeletionRequestAdapter(db);
  const deletionProof = createDeletionProofAdapter(app);
  let disposed = false;
  return {
    contracts,
    auth,
    workspace,
    deletionRequests,
    deletionProof,
    async dispose() {
      if (disposed) return;
      disposed = true;
      workspace.dispose();
      deletionRequests.dispose();
      deletionProof.dispose();
      auth.dispose();
      await terminate(db);
      await deleteApp(app);
    },
  };
}
