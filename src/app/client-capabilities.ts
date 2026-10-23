import type { ClientCapabilities } from '../domain/compatibility';
export function clientCapabilities(
  environmentId: string,
  buildId: string,
): ClientCapabilities {
  return {
    appVersion: '0.1.0',
    buildId,
    environmentId,
    contractFormats: [1],
    families: {
      compatibilityProbe: { readableSchemas: [1], writeSchema: 1 },
    },
  };
}
