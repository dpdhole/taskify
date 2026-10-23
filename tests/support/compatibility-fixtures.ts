import type {
  ClientCapabilities,
  CompatibilityContract,
} from '../../src/domain/compatibility';
export const capabilities: ClientCapabilities = {
  appVersion: '0.1.0',
  buildId: 'test-build',
  environmentId: 'demo-taskify-compatibility',
  contractFormats: [1],
  families: { compatibilityProbe: { readableSchemas: [1], writeSchema: 1 } },
};
export function contract(
  overrides: Partial<CompatibilityContract> = {},
): CompatibilityContract {
  return {
    contractFormatVersion: 1,
    revision: 1,
    environmentId: capabilities.environmentId,
    serverRelease: 1,
    minAppVersion: '0.1.0',
    maxAppVersion: '0.1.0',
    recordFamilies: {
      compatibilityProbe: {
        presentSchemaVersions: [1],
        allowedWriteSchemaVersions: [1],
      },
    },
    ...overrides,
  };
}
