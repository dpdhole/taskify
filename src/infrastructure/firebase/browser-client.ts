import { initializeApp } from 'firebase/app';

export const firebaseAppName = 'taskify-browser';
export const firebaseProjectId = 'taskify-dev-dpdhole';
export const canonicalAuthDomain = 'taskify-dev-dpdhole.firebaseapp.com';
export const previewAuthDomains = [
  'taskify-dev-dpdhole--dev-por3atkf.web.app',
  'taskify-dev-dpdhole--qc-xnxat620.web.app',
  'taskify-dev-dpdhole--uat-hzsuai7v.web.app',
] as const;
const hostingDomains: readonly string[] = [
  canonicalAuthDomain,
  'taskify-dev-dpdhole.web.app',
  ...previewAuthDomains,
];
export interface BrowserClientConfig {
  projectId: string;
  apiKey: string;
  appId: string;
  authDomain: string;
}

/** Resolve only known hosts: the same artifact can move between preview channels. */
export function decodeBrowserClientConfig(
  raw: unknown,
  hostname: string,
): BrowserClientConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    throw Error('Invalid Firebase browser configuration');
  const value = raw as Record<string, unknown>;
  if (
    value.projectId !== firebaseProjectId ||
    typeof value.apiKey !== 'string' ||
    !value.apiKey.trim() ||
    value.apiKey !== value.apiKey.trim() ||
    typeof value.appId !== 'string' ||
    !/^1:243252492098:web:[a-f0-9]+$/.test(value.appId) ||
    value.authDomain !== canonicalAuthDomain ||
    value.emulator !== undefined
  )
    throw Error('Missing or mismatched Firebase browser configuration');
  if (hostname !== 'localhost' && !hostingDomains.includes(hostname))
    throw Error(
      'Unapproved authentication host; use localhost for local development',
    );
  return {
    projectId: firebaseProjectId,
    apiKey: value.apiKey,
    appId: value.appId,
    authDomain: hostname === 'localhost' ? canonicalAuthDomain : hostname,
  };
}

/** The application composition owns this stable instance and its teardown. */
export function createBrowserClient(raw: unknown, hostname: string) {
  return initializeApp(
    decodeBrowserClientConfig(raw, hostname),
    firebaseAppName,
  );
}
