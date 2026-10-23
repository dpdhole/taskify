import { afterEach, expect, it } from 'vitest';
import { deleteApp, getApps } from 'firebase/app';
import {
  canonicalAuthDomain,
  createBrowserClient,
  decodeBrowserClientConfig,
  firebaseAppName,
  firebaseProjectId,
  previewAuthDomains,
} from '../../src/infrastructure/firebase/browser-client';
const config = {
  projectId: firebaseProjectId,
  apiKey: 'public-test-key',
  appId: '1:243252492098:web:abcdef123',
  authDomain: canonicalAuthDomain,
};
afterEach(async () => {
  await Promise.all(getApps().map((app) => deleteApp(app)));
});
it('uses same-origin helpers on exactly the approved preview hosts without rebuilding', () => {
  for (const host of previewAuthDomains) {
    expect(decodeBrowserClientConfig(config, host)).toEqual({
      ...config,
      authDomain: host,
    });
  }
  expect(decodeBrowserClientConfig(config, 'localhost').authDomain).toBe(
    canonicalAuthDomain,
  );
  expect(
    decodeBrowserClientConfig(config, canonicalAuthDomain).authDomain,
  ).toBe(canonicalAuthDomain);
});
it('rejects unknown hosts, suffix attacks and the unauthorized loopback alias', () => {
  for (const host of [
    '127.0.0.1',
    'other.example',
    previewAuthDomains[0] + '.attacker.example',
    'https://' + previewAuthDomains[0],
    '',
  ]) {
    expect(() => decodeBrowserClientConfig(config, host)).toThrow('Unapproved');
  }
});
it('rejects incomplete, wrong-project or emulator-mixed cloud configuration without echoing values', () => {
  for (const raw of [
    null,
    [],
    {},
    { ...config, apiKey: '' },
    { ...config, apiKey: ' key ' },
    { ...config, appId: '1:other:web:abc' },
    { ...config, projectId: 'other' },
    { ...config, authDomain: 'attacker.example' },
    { ...config, emulator: { host: '127.0.0.1' } },
  ]) {
    expect(() => decodeBrowserClientConfig(raw, 'localhost')).toThrow();
  }
});
it('uses one stable Firebase app identity and refuses mismatched reinitialization', () => {
  const first = createBrowserClient(config, 'localhost');
  expect(first.name).toBe(firebaseAppName);
  expect(createBrowserClient(config, 'localhost')).toBe(first);
  expect(() =>
    createBrowserClient(
      { ...config, apiKey: 'different-public-key' },
      'localhost',
    ),
  ).toThrow();
  expect(getApps()).toHaveLength(1);
});
