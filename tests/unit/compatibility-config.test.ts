import { it, expect } from 'vitest';
import { decodeContractConfig } from '../../src/infrastructure/firebase/contract-reader';
it('requires explicit loopback for demo targets and pins cloud identity without requiring an app registration', () => {
  expect(() =>
    decodeContractConfig({ projectId: 'demo-test', apiKey: 'demo' }),
  ).toThrow();
  expect(() =>
    decodeContractConfig({
      projectId: 'demo-test',
      apiKey: 'demo',
      emulator: { host: 'localhost', port: 8080 },
    }),
  ).toThrow();
  expect(
    decodeContractConfig({ projectId: 'taskify-dev-dpdhole' }).projectId,
  ).toBe('taskify-dev-dpdhole');
  expect(
    decodeContractConfig({
      projectId: 'demo-test',
      apiKey: 'demo',
      emulator: { host: '127.0.0.1', port: 8080 },
    }).emulator?.port,
  ).toBe(8080);
  expect(() =>
    decodeContractConfig({ projectId: 'other', apiKey: 'public' }),
  ).toThrow();
  expect(() =>
    decodeContractConfig({
      projectId: 'taskify-dev-dpdhole',
      apiKey: 'public',
      emulator: { host: '127.0.0.1', port: 8080 },
    }),
  ).toThrow();
  expect(() =>
    decodeContractConfig({
      projectId: 'taskify-dev-dpdhole',
      apiKey: 'public',
      appId: '1:wrong:web:abc',
    }),
  ).toThrow();
  expect(
    decodeContractConfig({ projectId: 'taskify-dev-dpdhole', apiKey: 'public' })
      .projectId,
  ).toBe('taskify-dev-dpdhole');
});
