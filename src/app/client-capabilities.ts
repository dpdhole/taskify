import { WORKSPACE_SCHEMA_FAMILIES } from '../domain/workspace-seeds';
import type { ClientCapabilities } from '../domain/compatibility';
export function clientCapabilities(
  environmentId: string,
  buildId: string,
  workspace = false,
): ClientCapabilities {
  return {
    appVersion: '0.1.0',
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
                ...(family === 'accountDeletion' ? {} : { writeSchema: 1 }),
              },
            ]),
          )
        : {}),
    },
  };
}
