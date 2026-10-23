import { StrictMode } from 'react';
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
let firebase: ReturnType<typeof createContractReader> | undefined;
let reader: ContractReader;
try {
  if (!import.meta.env.VITE_TASKIFY_PROJECT_ID)
    throw Error('Firebase target is not configured');
  firebase = createContractReader({
    projectId: environmentId,
    apiKey: import.meta.env.VITE_TASKIFY_API_KEY,
    appId: import.meta.env.VITE_TASKIFY_APP_ID,
  });
  reader = firebase.reader;
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
if (!navigator.onLine) gate.suspend('offline');
if (document.visibilityState === 'hidden') gate.suspend('hidden');
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    window.removeEventListener('online', online);
    window.removeEventListener('offline', offline);
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('pagehide', pagehide);
    window.removeEventListener('pageshow', pageshow);
    gate.dispose();
    projection.dispose();
    void firebase?.dispose();
  });
const root = document.getElementById('root');
if (!root) throw Error('Missing root');
createRoot(root).render(
  <StrictMode>
    <CompatibilityView
      projection={projection}
      retry={() => gate.recheck()}
      reload={() => location.reload()}
      appVersion={client.appVersion}
      buildId={client.buildId}
    />
  </StrictMode>,
);
