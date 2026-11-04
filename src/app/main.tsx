import { createWorkspaceController } from '../application/workspace-controller';
import type { WorkspaceController } from '../application/workspace-controller';
import { createWorkspaceStore } from '../state/workspace-store';
import { attachCompatibilityLifecycle } from '../infrastructure/browser/compatibility-lifecycle';
import { createSignInMethodsController } from '../application/sign-in-methods-controller';
import { createSignInMethodsStore } from '../state/sign-in-methods-store';
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
const authMode = import.meta.env.MODE === 'auth';
const client = clientCapabilities(environmentId, buildId, authMode);
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
let workspaceController: WorkspaceController | undefined;
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
      () => workspaceController?.clearAccountState(),
    )
  : undefined;
const sessionProjection = session ? createSessionStore(session) : undefined;
if (session && runtime)
  workspaceController = createWorkspaceController(
    runtime.workspace,
    session,
    {
      schedule(fn, ms) {
        const timer = window.setTimeout(fn, ms);
        return () => window.clearTimeout(timer);
      },
    },
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
const workspaceProjection = workspaceController
  ? createWorkspaceStore(workspaceController)
  : undefined;

const methodsController =
  session && runtime
    ? createSignInMethodsController(runtime.auth, session, {
        schedule(fn, ms) {
          const timer = window.setTimeout(fn, ms);
          return () => window.clearTimeout(timer);
        },
      })
    : undefined;
const methodsProjection = methodsController
  ? createSignInMethodsStore(methodsController)
  : undefined;
gate.start();
session?.start();
const stopLifecycle = attachCompatibilityLifecycle(gate);
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    stopLifecycle();
    workspaceController?.dispose();
    workspaceProjection?.dispose();
    methodsController?.dispose();
    methodsProjection?.dispose();
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
        workspace={
          workspaceController && workspaceProjection
            ? {
                projection: workspaceProjection,
                retry: () => workspaceController?.retry(),
                selectTimezone: (zone) =>
                  workspaceController?.selectTimezone(zone),
                continueWithoutProfile: () =>
                  workspaceController?.continueWithoutProfile(),
              }
            : undefined
        }
        methods={
          methodsController && methodsProjection
            ? {
                projection: methodsProjection,
                verify: (provider, transport) => {
                  const mobile =
                    location.hostname !== 'localhost' &&
                    location.hostname !== '127.0.0.1' &&
                    matchMedia('(pointer: coarse)').matches;
                  void methodsController.verify(
                    provider,
                    transport ?? (mobile ? 'redirect' : 'popup'),
                  );
                },
                requestLink: (target) => methodsController.requestLink(target),
                proveLink: (existing, transport) => {
                  const mobile =
                    location.hostname !== 'localhost' &&
                    location.hostname !== '127.0.0.1' &&
                    matchMedia('(pointer: coarse)').matches;
                  void methodsController.proveLink(
                    existing,
                    transport ?? (mobile ? 'redirect' : 'popup'),
                  );
                },
                submitLink: () => {
                  void methodsController.submitLink();
                },
                checkLink: () => {
                  void methodsController.checkLink();
                },
                cancelLink: () => methodsController.cancelLink(),
                cancelVerification: () =>
                  methodsController.cancelVerification(),
                open: () => {
                  void methodsController.open();
                },
                close: () => methodsController.close(),
                refresh: () => {
                  void methodsController.refresh();
                },
              }
            : undefined
        }
        projection={sessionProjection}
        compatibility={projection}
        signIn={(provider, transport) => {
          const mobile =
            location.hostname !== 'localhost' &&
            location.hostname !== '127.0.0.1' &&
            matchMedia('(pointer: coarse)').matches;
          void session.signIn(
            provider,
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
