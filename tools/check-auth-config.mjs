import { loadEnv } from 'vite';
import {
  canonicalAuthDomain,
  decodeBrowserClientConfig,
  firebaseAppName,
  previewAuthDomains,
} from '../src/infrastructure/firebase/browser-client.ts';

const env = loadEnv('auth', process.cwd(), 'VITE_TASKIFY_');
const raw = {
  projectId: env.VITE_TASKIFY_PROJECT_ID,
  apiKey: env.VITE_TASKIFY_API_KEY,
  appId: env.VITE_TASKIFY_APP_ID,
  authDomain: env.VITE_TASKIFY_AUTH_DOMAIN,
};
const local = decodeBrowserClientConfig(raw, 'localhost');
const hosts = ['localhost', ...previewAuthDomains];
console.log(
  JSON.stringify(
    {
      validated: true,
      projectId: local.projectId,
      appId: local.appId,
      appName: firebaseAppName,
      apiKeyConfigured: true,
      localAuthDomain: canonicalAuthDomain,
      hosts: hosts.map((hostname) => ({
        hostname,
        authDomain: decodeBrowserClientConfig(raw, hostname).authDomain,
      })),
      providerSignInTested: false,
      cloudChanged: false,
    },
    null,
    2,
  ),
);
