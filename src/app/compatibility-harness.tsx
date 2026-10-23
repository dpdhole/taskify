import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createCompatibilityGate } from '../application/compatibility-gate';
import { createProtectedConsumers } from '../application/protected-consumers';
import { createMemoryContract } from '../infrastructure/memory/contract-reader';
import { createContractReader } from '../infrastructure/firebase/contract-reader';
import { createCompatibilityStore } from '../state/compatibility-store';
import { CompatibilityHarnessView } from '../ui/CompatibilityHarnessView';
import { clientCapabilities } from './client-capabilities';
const client = clientCapabilities('demo-taskify-compatibility', 'test-harness');
const initial = {
  contractFormatVersion: 1,
  revision: 1,
  environmentId: client.environmentId,
  serverRelease: 1,
  minAppVersion: '0.1.0',
  maxAppVersion: '0.1.0',
  recordFamilies: {
    compatibilityProbe: {
      presentSchemaVersions: [1],
      allowedWriteSchemaVersions: [1],
    },
  },
};
const source = new URLSearchParams(location.search).get('source') || 'memory';
if (!['memory', 'emulator'].includes(source))
  throw Error('Unknown harness source');
const memory = createMemoryContract(initial);
const firebase =
  source === 'emulator'
    ? createContractReader({
        projectId: client.environmentId,
        apiKey: 'demo-only',
        emulator: { host: '127.0.0.1', port: 8080 },
      })
    : undefined;
const gate = createCompatibilityGate(
  firebase?.reader ?? memory.reader,
  client,
  {
    schedule(fn, ms) {
      const timer = window.setTimeout(fn, ms);
      return () => window.clearTimeout(timer);
    },
  },
);
const projection = createCompatibilityStore(gate);
let reconcileResult = 'confirmed' as const;
const consumer = createProtectedConsumers(
  gate,
  {
    async load() {
      return 'synthetic workspace';
    },
    async submit(_id, input) {
      if (input === 'reject') return 'rejected';
      if (input === 'unknown') {
        reconcileResult = 'confirmed';
        return 'unknown';
      }
      return 'confirmed';
    },
    async reconcile() {
      return reconcileResult;
    },
  },
  () => {},
);
let revision = 1;
const change =
  source === 'memory'
    ? (kind: 'ready' | 'blocked' | 'cache' | 'missing') => {
        memory.publish(
          kind === 'missing'
            ? null
            : {
                ...initial,
                revision: ++revision,
                minAppVersion: kind === 'blocked' ? '0.2.0' : '0.1.0',
                maxAppVersion: kind === 'blocked' ? '0.2.0' : '0.1.0',
              },
          kind !== 'cache',
        );
      }
    : undefined;
const offline = () => gate.suspend('offline');
const online = () => gate.recheck('reconnect');
const visibility = () => {
  if (document.visibilityState === 'hidden') gate.suspend('hidden');
  else gate.recheck('resume');
};
window.addEventListener('offline', offline);
window.addEventListener('online', online);
document.addEventListener('visibilitychange', visibility);
gate.start();
window.addEventListener(
  'pagehide',
  () => {
    gate.dispose();
    projection.dispose();
    consumer.dispose();
    void firebase?.dispose();
  },
  { once: true },
);
const root = document.getElementById('root');
if (!root) throw Error('Missing root');
createRoot(root).render(
  <StrictMode>
    <CompatibilityHarnessView
      projection={projection}
      retry={() => gate.recheck()}
      consumer={consumer}
      {...(change ? { change } : {})}
    />
  </StrictMode>,
);
