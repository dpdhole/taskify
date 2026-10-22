import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { createProbeSession } from '../application/probe-session';
import { createMemoryProbe } from '../infrastructure/memory/probe-reader';
import { createFirebaseProbe } from '../infrastructure/firebase/probe-reader';
import { createProbeStore } from '../state/probe-store';
import { ProofView } from '../ui/ProofView';
const root = document.getElementById('root');
if (!root) throw new Error('Missing root');
const source = new URLSearchParams(location.search).get('source');
if (source && source !== 'memory' && source !== 'emulator')
  throw new Error('Unknown proof source');
const memory = createMemoryProbe();
const firebase =
  source === 'emulator'
    ? createFirebaseProbe({
        projectId: 'demo-taskify-foundation',
        host: '127.0.0.1',
        firestorePort: 8080,
      })
    : undefined;
const projection = createProbeStore();
const session = createProbeSession(
  firebase?.reader ?? memory.reader,
  projection.publish,
);
let revision = 0;
const model = {
  ...projection,
  ...session,
  ...(firebase
    ? {}
    : {
        advance: () =>
          memory.publish({
            message: 'Memory connection verified',
            revision: ++revision,
          }),
      }),
};
const router = createBrowserRouter([
  { path: '*', element: <ProofView model={model} /> },
]);
window.addEventListener(
  'pagehide',
  () => {
    session.stop();
    void firebase?.dispose();
  },
  { once: true },
);
createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
