export type LocalConfig = Readonly<{
  projectId: string;
  host: string;
  firestorePort: number;
}>;
export function decodeLocalConfig(raw: unknown): LocalConfig {
  if (typeof raw !== 'object' || raw === null)
    throw new Error('Invalid local configuration');
  const data = raw as Record<string, unknown>;
  if (
    data.projectId !== 'demo-taskify-foundation' ||
    data.host !== '127.0.0.1' ||
    data.firestorePort !== 8080
  )
    throw new Error(
      'Foundation requires the demo project and loopback emulator',
    );
  return {
    projectId: data.projectId,
    host: data.host,
    firestorePort: data.firestorePort,
  };
}
