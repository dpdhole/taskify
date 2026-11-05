import { WORKSPACE_SCHEMA_FAMILIES } from '../domain/workspace-families.ts';
import type { ClientCapabilities } from '../domain/compatibility';
export const APP_VERSION = '0.3.0';
export function clientCapabilities(
  environmentId: string,
  buildId: string,
  workspace = false,
): ClientCapabilities {
  return {
    appVersion: APP_VERSION,
    buildId,
    environmentId,
    contractFormats: [1],
    families: {
      compatibilityProbe: { readableSchemas: [1], writeSchema: 1 },
      ...(workspace
        ? Object.fromEntries(
            WORKSPACE_SCHEMA_FAMILIES.map((family) => [
              family,
              {
                readableSchemas: [1],
                writeSchema: 1,
              },
            ]),
          )
        : {}),
    },
  };
}
