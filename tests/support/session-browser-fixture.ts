import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { SessionView } from '../../src/ui/SessionView';
import { createSessionStore } from '../../src/state/session-store';
import { createCompatibilityStore } from '../../src/state/compatibility-store';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { createAuthAdapter } from '../../src/infrastructure/firebase/auth-adapter';
import { createCompatibilityGate } from '../../src/application/compatibility-gate';
import { createSessionController } from '../../src/application/session-controller';
import { capabilities, contract } from './compatibility-fixtures';
export function createSessionFixture() {
  const app = initializeApp(
    {
      projectId: 'demo-taskify-session',
      apiKey: 'demo-only',
      authDomain: 'demo-taskify-session.firebaseapp.com',
    },
    'taskify-session-fixture',
  );
  const auth = createAuthAdapter(app, { host: '127.0.0.1', port: 9099 });
  const clock = {
    schedule(fn: () => void, ms: number) {
      const timer = window.setTimeout(fn, ms);
      return () => window.clearTimeout(timer);
    },
  };
  const gate = createCompatibilityGate(
    {
      readServer: async () => contract(),
      watch(next) {
        next(contract(), true);
        return () => {};
      },
    },
    capabilities,
    clock,
  );
  const session = createSessionController(auth, gate, clock, () => {});
  const projection = createSessionStore(session);
  const compatibility = createCompatibilityStore(gate);
  const ordinaryRoot = document.getElementById('root');
  if (ordinaryRoot) ordinaryRoot.hidden = true;
  const mount = document.createElement('div');
  document.body.append(mount);
  const root = createRoot(mount);
  root.render(
    createElement(SessionView, {
      projection,
      compatibility,
      signIn: (provider: 'google' | 'microsoft', transport?: 'redirect') => {
        void session.signIn(provider, transport ?? 'popup');
      },
      retrySession: () => session.retry(),
      logout: () => {
        void session.signOut();
      },
      retryCompatibility: () => gate.recheck(),
      reload: () => location.reload(),
      appVersion: '0.1.0',
      buildId: 'emulator-session-fixture',
    }),
  );
  gate.start();
  session.start();
  return {
    state: () => session.getState(),
    async signIn(subject: string) {
      const encode = (v: unknown) =>
        btoa(JSON.stringify(v))
          .replaceAll('=', '')
          .replaceAll('+', '-')
          .replaceAll('/', '_');
      const token =
        encode({ alg: 'none', typ: 'JWT' }) +
        '.' +
        encode({
          sub: subject,
          iss: 'https://accounts.google.com',
          aud: 'demo-only',
          email: subject + '@example.invalid',
          email_verified: true,
        }) +
        '.';
      await signInWithCredential(
        getAuth(app),
        GoogleAuthProvider.credential(token),
      );
    },
    logout: () => session.signOut(),
    offline: () => gate.suspend('offline'),
    online: () => gate.recheck('reconnect'),
    async dispose() {
      root.unmount();
      mount.remove();
      if (ordinaryRoot) ordinaryRoot.hidden = false;
      projection.dispose();
      compatibility.dispose();
      session.dispose();
      gate.dispose();
      await deleteApp(app);
    },
  };
}
export type SessionFixture = ReturnType<typeof createSessionFixture>;
declare global {
  interface Window {
    sessionFixture: SessionFixture;
  }
}
