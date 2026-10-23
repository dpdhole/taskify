import { StrictMode } from 'react';
import {
  createSessionController,
  SessionError,
} from '../application/session-controller';
import { createSessionStore } from '../state/session-store';
import { SessionView } from '../ui/SessionView';
import { createBrowserRuntime } from '../infrastructure/firebase/browser-runtime';
import { createRoot } from 'react-dom/client';
import { createCompatibilityGate } from '../application/compatibility-gate';
import type { ContractReader } from '../application/compatibility-gate';
import { createContractReader } from '../infrastructure/firebase/contract-reader';
import { createCompatibilityStore } from '../state/compatibility-store';
import { CompatibilityView } from '../ui/CompatibilityView';
import { clientCapabilities } from './client-capabilities';
const environmentId =
  import.meta.env.VITE_TASKIFY_PROJECT_ID || 'taskify-dev-dpdhole';
const buildId =
  import.meta.env.VITE_TASKIFY_BUILD_ID || 'development-unpublished';
const client = clientCapabilities(environmentId, buildId);
const authMode = import.meta.env.MODE === 'auth';
let runtime: ReturnType<typeof createBrowserRuntime> | undefined;
let firebase: ReturnType<typeof createContractReader> | undefined;
let reader: ContractReader;
try {
  if (!import.meta.env.VITE_TASKIFY_PROJECT_ID)
    throw Error('Firebase target is not configured');
  if (authMode) {
    runtime = createBrowserRuntime(
      {
        projectId: environmentId,
        apiKey: import.meta.env.VITE_TASKIFY_API_KEY,
        appId: import.meta.env.VITE_TASKIFY_APP_ID,
        authDomain: import.meta.env.VITE_TASKIFY_AUTH_DOMAIN,
      },
      location.hostname,
    );
    reader = runtime.contracts.reader;
  } else {
    firebase = createContractReader({
      projectId: environmentId,
      apiKey: import.meta.env.VITE_TASKIFY_API_KEY,
      appId: import.meta.env.VITE_TASKIFY_APP_ID,
    });
    reader = firebase.reader;
  }
} catch {
  reader = {
    readServer: async () => null,
    watch(next) {
      next(null, true);
      return () => {};
    },
  };
}
const gate = createCompatibilityGate(reader, client, {
  schedule(fn, ms) {
    const timer = window.setTimeout(fn, ms);
    return () => window.clearTimeout(timer);
  },
});
const projection = createCompatibilityStore(gate);
const session = authMode
  ? createSessionController(
      runtime?.auth ?? {
        initialize: async () => {
          throw new SessionError('configuration');
        },
        observe(next) {
          next(null);
          return () => {};
        },
        signOut: async () => {
          throw new SessionError('logout');
        },
        dispose() {},
      },
      gate,
      {
        schedule(fn, ms) {
          const timer = window.setTimeout(fn, ms);
          return () => window.clearTimeout(timer);
        },
      },
      () => {},
    )
  : undefined;
const sessionProjection = session ? createSessionStore(session) : undefined;
const online = () => gate.recheck('reconnect');
const offline = () => gate.suspend('offline');
const visibility = () => {
  if (document.visibilityState === 'hidden') gate.suspend('hidden');
  else gate.recheck('resume');
};
const pagehide = () => gate.suspend('hidden');
const pageshow = (event: PageTransitionEvent) => {
  if (event.persisted) gate.recheck('resume');
};
window.addEventListener('online', online);
window.addEventListener('offline', offline);
document.addEventListener('visibilitychange', visibility);
window.addEventListener('pagehide', pagehide);
window.addEventListener('pageshow', pageshow);
gate.start();
session?.start();
if (!navigator.onLine) gate.suspend('offline');
if (document.visibilityState === 'hidden') gate.suspend('hidden');
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    window.removeEventListener('online', online);
    window.removeEventListener('offline', offline);
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('pagehide', pagehide);
    window.removeEventListener('pageshow', pageshow);
    session?.dispose();
    sessionProjection?.dispose();
    gate.dispose();
    projection.dispose();
    void firebase?.dispose();
    void runtime?.dispose();
  });
const root = document.getElementById('root');
if (!root) throw Error('Missing root');
createRoot(root).render(
  <StrictMode>
    {session && sessionProjection ? (
      <SessionView
        projection={sessionProjection}
        compatibility={projection}
        signInGoogle={(transport) => {
          const mobile =
            location.hostname !== 'localhost' &&
            location.hostname !== '127.0.0.1' &&
            matchMedia('(pointer: coarse)').matches;
          void session.signInGoogle(
            transport ?? (mobile ? 'redirect' : 'popup'),
          );
        }}
        retrySession={() => session.retry()}
        logout={() => {
          void session.signOut();
        }}
        retryCompatibility={() => gate.recheck()}
        reload={() => location.reload()}
        appVersion={client.appVersion}
        buildId={client.buildId}
      />
    ) : (
      <CompatibilityView
        projection={projection}
        retry={() => gate.recheck()}
        reload={() => location.reload()}
        appVersion={client.appVersion}
        buildId={client.buildId}
      />
    )}
  </StrictMode>,
);
