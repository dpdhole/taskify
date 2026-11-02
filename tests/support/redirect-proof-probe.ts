// Headless emulator fixture for the production redirect adapter; no cloud config.
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { createAuthAdapter } from '../../src/infrastructure/firebase/auth-adapter';
export async function createRedirectProbe() {
  if (import.meta.env.MODE !== 'session-test')
    throw Error('Emulator fixture only');
  const app = initializeApp(
    {
      projectId: 'demo-taskify-redirect',
      apiKey: 'demo-only',
      authDomain: 'demo-taskify-redirect.firebaseapp.com',
    },
    'taskify-redirect-main-probe',
  );
  const adapter = createAuthAdapter(app, { host: '127.0.0.1', port: 9099 });
  await adapter.initialize();
  const main = getAuth(app);
  const snapshot = main.currentUser
    ? await adapter.readSignInMethods(main.currentUser.uid)
    : undefined;
  const returned = snapshot?.verificationReturn;
  const result = {
    accepted: returned?.reason === 'none',
    reason: returned?.reason ?? 'none',
    ...(returned?.reason === 'none' ? { uid: snapshot?.uid } : {}),
  };
  const region = document.createElement('section');
  for (const id of ['google', 'microsoft'] as const) {
    const login = document.createElement('button');
    login.textContent = 'Probe sign in ' + id;
    login.onclick = () => {
      void adapter.signIn!(id, 'popup');
    };
    region.append(login);
    const verify = document.createElement('button');
    verify.textContent = 'Probe verify ' + id;
    verify.onclick = () => {
      if (main.currentUser)
        void adapter.reauthenticate!(main.currentUser.uid, id, 'redirect');
    };
    region.append(verify);
  }
  document.body.append(region);
  return {
    state: () => ({
      mainUid: main.currentUser?.uid,
      proofUid: getApps().find((a) => a.name === 'taskify-proof:' + app.name)
        ? 'unexpected-context'
        : undefined,
      result,
    }),
    logout: () => adapter.signOut(),
  };
}
export type RedirectProbe = Awaited<ReturnType<typeof createRedirectProbe>>;
declare global {
  interface Window {
    redirectProbe: RedirectProbe;
  }
}
