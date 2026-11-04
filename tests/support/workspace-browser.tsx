import { getAuth } from 'firebase/auth';
import { createAuthAdapter } from '../../src/infrastructure/firebase/auth-adapter';
import { createRoot } from 'react-dom/client';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  memoryLocalCache,
  terminate,
} from 'firebase/firestore';
import { createContractReaderForDatabase } from '../../src/infrastructure/firebase/contract-reader';
import { createWorkspaceAdapter } from '../../src/infrastructure/firebase/workspace-adapter';
import { createWorkspaceController } from '../../src/application/workspace-controller';
import { createWorkspaceStore } from '../../src/state/workspace-store';
import { createCompatibilityGate } from '../../src/application/compatibility-gate';
import { createCompatibilityStore } from '../../src/state/compatibility-store';
import { createSessionController } from '../../src/application/session-controller';
import type { SessionIdentity } from '../../src/application/session-controller';
import { createSessionStore } from '../../src/state/session-store';
import {
  APP_VERSION,
  clientCapabilities,
} from '../../src/app/client-capabilities';
import { SessionView } from '../../src/ui/SessionView';
import { WorkspaceError } from '../../src/application/workspace-port';
import { attachCompatibilityLifecycle } from '../../src/infrastructure/browser/compatibility-lifecycle';
const projectId = 'demo-taskify-provisioning-stage';
const query = new URLSearchParams(location.search);
const uid = query.get('uid') ?? 'browser-owner';
const app = initializeApp(
  {
    projectId,
    apiKey: 'synthetic-key',
    appId: 'synthetic-app',
    authDomain: projectId + '.firebaseapp.com',
  },
  'workspace-browser',
);
const db = initializeFirestore(app, { localCache: memoryLocalCache() });
connectFirestoreEmulator(
  db,
  '127.0.0.1',
  8080,
  query.has('sdkAuth') ? undefined : { mockUserToken: { sub: uid } },
);
const reader = createContractReaderForDatabase(db);
const clock = {
  schedule(fn: () => void, ms: number) {
    const timer = setTimeout(fn, ms);
    return () => clearTimeout(timer);
  },
};
const gate = createCompatibilityGate(
  reader.reader,
  clientCapabilities(projectId, 'synthetic-workspace', true),
  clock,
);
const gateProjection = createCompatibilityStore(gate);
let identity: SessionIdentity | null = {
  uid,
  displayName: query.has('badProfile') ? 'x'.repeat(1025) : 'Browser profile',
};
const observers = new Set<(identity: SessionIdentity | null) => void>();

const auth = query.has('sdkAuth')
  ? createAuthAdapter(app, { host: '127.0.0.1', port: 9099 })
  : {
      initialize: async () => {},
      observe(next: (identity: SessionIdentity | null) => void) {
        observers.add(next);
        next(identity);
        return () => {
          observers.delete(next);
        };
      },
      signOut: async () => {
        identity = null;
        for (const next of observers) next(null);
      },
      dispose() {},
    };
const session = createSessionController(auth, gate, clock, () =>
  workspace?.clearAccountState(),
);
const sessionProjection = createSessionStore(session);
const real = createWorkspaceAdapter(db);
let release: () => void = () => {},
  paused = false,
  lost = false;
const stageCalls: number[] = [];
const port = {
  ...real,
  async stage(...args: Parameters<typeof real.stage>) {
    stageCalls.push(args[1]);
    if (query.has('pause') && args[1] === 1 && !paused) {
      paused = true;
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    }
    await real.stage(...args);
    if (query.has('lostAck') && args[1] === 1 && !lost) {
      lost = true;
      throw new WorkspaceError('uncertain');
    }
  },
};
const workspace = createWorkspaceController(
  port,
  session,
  clock,
  () => query.get('timezone') ?? 'UTC',
);
const workspaceProjection = createWorkspaceStore(workspace);
const stopLifecycle = attachCompatibilityLifecycle(gate);
gate.start();
session.start();
const root = createRoot(document.getElementById('root')!);
root.render(
  <SessionView
    projection={sessionProjection}
    compatibility={gateProjection}
    signIn={(provider, transport) => {
      void session.signIn(provider, transport ?? 'popup');
    }}
    retrySession={() => session.retry()}
    logout={() => {
      void session.signOut();
    }}
    retryCompatibility={() => gate.recheck()}
    reload={() => location.reload()}
    appVersion={APP_VERSION}
    buildId="synthetic-workspace"
    workspace={{
      projection: workspaceProjection,
      retry: () => workspace!.retry(),
      selectTimezone: (zone) => workspace!.selectTimezone(zone),
      continueWithoutProfile: () => workspace!.continueWithoutProfile(),
    }}
  />,
);
const fixture = {
  async authAudience() {
    return (
      (await getAuth(app).currentUser?.getIdTokenResult())?.claims.aud ?? null
    );
  },
  sessionUid: () => session.getState().identity?.uid ?? null,
  state: () => workspace!.getState(),
  stageCalls: () => [...stageCalls],
  release: () => release(),
  providerChanged() {
    identity = { uid, displayName: 'Changed provider profile' };
    for (const next of observers) next(identity);
  },
  async dispose() {
    stopLifecycle();
    workspace!.dispose();
    workspaceProjection.dispose();
    session.dispose();
    sessionProjection.dispose();
    gate.dispose();
    gateProjection.dispose();
    root.unmount();
    await terminate(db);
    await deleteApp(app);
  },
};
declare global {
  interface Window {
    workspaceFixture: typeof fixture;
  }
}
window.workspaceFixture = fixture;
