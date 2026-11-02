import { initializeApp, deleteApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  inMemoryPersistence,
  connectAuthEmulator,
  updateCurrentUser,
  reload,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import type { SignInProvider } from '../../application/session-controller';
import { SessionError } from '../../application/session-controller';
// Read server metadata on an SDK-owned copy. Reloading the primary user emits
// token notifications that restart its shared Firestore compatibility listener.
export async function readAuthMethods(
  app: FirebaseApp,
  user: User,
  emulator?: { host: '127.0.0.1'; port: 9099 },
) {
  const isolatedApp = initializeApp(
    app.options,
    `taskify-methods:${app.name}:${crypto.randomUUID()}`,
  );
  try {
    const auth = initializeAuth(isolatedApp, {
      persistence: inMemoryPersistence,
    });
    if (emulator)
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
        disableWarnings: true,
      });
    await updateCurrentUser(auth, user);
    const copy = auth.currentUser;
    if (!copy || copy === user || copy.uid !== user.uid)
      throw new SessionError('restoration');
    await reload(copy);
    return {
      uid: copy.uid,
      providers: copy.providerData.flatMap((info): SignInProvider[] =>
        info.providerId === 'google.com'
          ? ['google']
          : info.providerId === 'microsoft.com'
            ? ['microsoft']
            : [],
      ),
    };
  } finally {
    await deleteApp(isolatedApp);
  }
}
