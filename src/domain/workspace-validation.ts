/** Provider-independent validators shared by the provisioning codecs. */
export class WorkspaceDataError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}
export function fail(code = 'invalid-workspace-data'): never {
  throw new WorkspaceDataError(code);
}
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail();
  const prototype: unknown = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) fail();
  return value as Record<string, unknown>;
}
export function keys(
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[] = [],
) {
  if (
    required.some((key) => !Object.hasOwn(value, key)) ||
    Object.keys(value).some(
      (key) => !required.includes(key) && !optional.includes(key),
    )
  )
    fail();
}
export function member<T extends string>(
  value: unknown,
  options: readonly T[],
): T {
  if (typeof value !== 'string' || !options.includes(value as T)) fail();
  return value as T;
}
export function boolean(value: unknown): boolean {
  if (typeof value !== 'boolean') fail();
  return value;
}
export function safeInteger(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) fail();
  return value;
}
export function recordId(value: unknown): string {
  // Path segments, not display names. Referenced documents need not exist/be active.
  if (
    typeof value !== 'string' ||
    !value ||
    value !== value.trim() ||
    value === '.' ||
    value === '..' ||
    /[\/\u0000-\u001f\u007f]/u.test(value) ||
    /^__.*__$/u.test(value)
  )
    fail();
  return value;
}
export function calendarDate(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) fail();
  const parsed = Date.parse(value + 'T00:00:00.000Z');
  if (
    !Number.isFinite(parsed) ||
    new Date(parsed).toISOString().slice(0, 10) !== value
  )
    fail();
  return value;
}
export function instant(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/u.test(value)
  )
    fail();
  calendarDate(value.slice(0, 10));
  const parsed = Date.parse(value);
  if (
    !Number.isFinite(parsed) ||
    new Date(parsed).toISOString().slice(0, 19) !== value.slice(0, 19)
  )
    fail();
  return value;
}

/** UTF-8 byte count with malformed surrogate rejection, without browser globals. */
export function utf8Length(value: string): number {
  let bytes = 0;
  for (const character of value) {
    const point = character.codePointAt(0)!;
    if (point >= 0xd800 && point <= 0xdfff) fail('invalid-unicode');
    bytes += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
  }
  return bytes;
}
