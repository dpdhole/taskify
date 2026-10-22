/** Synthetic Foundation value, not a Task or a production schema. */
export type ProbeValue = Readonly<{ message: string; revision: number }>;

export function decodeProbe(value: unknown): ProbeValue {
  if (typeof value !== 'object' || value === null)
    throw new Error('Invalid probe data');
  const record = value as Record<string, unknown>;
  if (
    typeof record.message !== 'string' ||
    record.message.length === 0 ||
    record.message.length > 256 ||
    typeof record.revision !== 'number' ||
    !Number.isSafeInteger(record.revision) ||
    record.revision < 0
  )
    throw new Error('Invalid probe data');
  return { message: record.message, revision: record.revision };
}
