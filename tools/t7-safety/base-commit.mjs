const metadata = { schemaVersion: 1, recordVersion: 1 };
const timestamps = ['createdAt', 'updatedAt'];
export const baseRecords = [
  {
    suffix: 'initialization/workspace',
    fields: { ...metadata, templateVersion: 1, status: 'initializing' },
    timestamps,
  },
  { suffix: 'profile/main', fields: metadata, timestamps },
  {
    suffix: 'settings/main',
    fields: { ...metadata, timezone: 'UTC' },
    timestamps,
  },
  {
    suffix: 'initializationStages/base',
    fields: { schemaVersion: 1, templateVersion: 1 },
    timestamps: ['completedAt'],
  },
];
/** Same base records as the SDK batch, with explicit create preconditions. */
export function baseCommitRequest(project, uid) {
  if (!/^[a-z][a-z0-9-]+$/.test(project) || !/^[A-Za-z0-9_-]{1,128}$/.test(uid))
    throw Error('Invalid base commit target');
  return {
    writes: baseRecords.map((record) => ({
      update: {
        name: `projects/${project}/databases/(default)/documents/users/${uid}/${record.suffix}`,
        fields: Object.fromEntries(
          Object.entries(record.fields).map(([field, value]) => [
            field,
            typeof value === 'number'
              ? { integerValue: String(value) }
              : { stringValue: value },
          ]),
        ),
      },
      currentDocument: { exists: false },
      updateTransforms: record.timestamps.map((fieldPath) => ({
        fieldPath,
        setToServerValue: 'REQUEST_TIME',
      })),
    })),
  };
}
