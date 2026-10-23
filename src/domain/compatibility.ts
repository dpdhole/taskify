export interface FamilyPolicy {
  presentSchemaVersions: number[];
  allowedWriteSchemaVersions: number[];
}
export interface CompatibilityContract {
  contractFormatVersion: number;
  revision: number;
  environmentId: string;
  serverRelease: number;
  minAppVersion: string;
  maxAppVersion: string;
  recordFamilies: Record<string, FamilyPolicy>;
}
export interface ClientCapabilities {
  appVersion: string;
  buildId: string;
  environmentId: string;
  contractFormats: readonly number[];
  families: Readonly<
    Record<
      string,
      {
        readableSchemas: readonly number[];
        writeSchema?: number;
      }
    >
  >;
}
export type CompatibilityReason =
  'client-too-old' | 'client-ahead' | 'unreadable-data' | 'writer-prohibited';
export class ContractError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}
function invalid(code: string): never {
  throw new ContractError(code);
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    invalid('malformed-contract');
  return value as Record<string, unknown>;
}
function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value !== value.trim())
    invalid('malformed-contract');
  return value;
}
function positive(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1)
    invalid('malformed-contract');
  return value;
}
function versions(value: unknown): number[] {
  if (!Array.isArray(value) || !value.length) invalid('malformed-contract');
  const result = value.map(positive).sort((a, b) => a - b);
  if (new Set(result).size !== result.length) invalid('malformed-contract');
  return result;
}
export function parseAppVersion(raw: unknown): readonly number[] {
  if (
    typeof raw !== 'string' ||
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(raw)
  )
    invalid('malformed-version');
  const parts = raw.split('.').map(Number);
  if (parts.some((p) => !Number.isSafeInteger(p))) invalid('malformed-version');
  return parts;
}
export function compareAppVersions(a: string, b: string): number {
  const left = parseAppVersion(a);
  const right = parseAppVersion(b);
  for (let i = 0; i < 3; i++) {
    const delta = left[i]! - right[i]!;
    if (delta) return Math.sign(delta);
  }
  return 0;
}
export function decodeContract(raw: unknown): CompatibilityContract {
  const value = object(raw);
  const contractFormatVersion = positive(value.contractFormatVersion);
  if (contractFormatVersion !== 1) invalid('unsupported-format');
  const families = object(value.recordFamilies);
  if (!Object.keys(families).length) invalid('malformed-contract');
  const recordFamilies: Record<string, FamilyPolicy> = Object.create(null);
  for (const name of Object.keys(families).sort()) {
    text(name);
    const family = object(families[name]);
    const presentSchemaVersions = versions(family.presentSchemaVersions);
    const allowedWriteSchemaVersions = versions(
      family.allowedWriteSchemaVersions,
    );
    if (
      allowedWriteSchemaVersions.some((v) => !presentSchemaVersions.includes(v))
    )
      invalid('incoherent-schemas');
    recordFamilies[name] = {
      presentSchemaVersions,
      allowedWriteSchemaVersions,
    };
  }
  const minAppVersion = text(value.minAppVersion);
  const maxAppVersion = text(value.maxAppVersion);
  if (compareAppVersions(minAppVersion, maxAppVersion) > 0)
    invalid('reversed-range');
  return {
    contractFormatVersion,
    revision: positive(value.revision),
    environmentId: text(value.environmentId),
    serverRelease: positive(value.serverRelease),
    minAppVersion,
    maxAppVersion,
    recordFamilies,
  };
}
export function validateClient(client: ClientCapabilities): void {
  parseAppVersion(client.appVersion);
  text(client.buildId);
  text(client.environmentId);
  versions([...client.contractFormats]);
  for (const family of Object.values(client.families)) {
    const readable = versions([...family.readableSchemas]);
    if (
      family.writeSchema !== undefined &&
      !readable.includes(positive(family.writeSchema))
    )
      invalid('invalid-client');
  }
}
export function evaluateCompatibility(
  contract: CompatibilityContract,
  client: ClientCapabilities,
): CompatibilityReason | null {
  validateClient(client);
  if (contract.environmentId !== client.environmentId)
    invalid('wrong-environment');
  if (!client.contractFormats.includes(contract.contractFormatVersion))
    invalid('unsupported-format');
  if (compareAppVersions(client.appVersion, contract.minAppVersion) < 0)
    return 'client-too-old';
  if (compareAppVersions(client.appVersion, contract.maxAppVersion) > 0)
    return 'client-ahead';
  for (const [name, capability] of Object.entries(client.families)) {
    const policy = contract.recordFamilies[name];
    if (!policy) invalid('missing-family');
    if (
      policy.presentSchemaVersions.some(
        (v) => !capability.readableSchemas.includes(v),
      )
    )
      return 'unreadable-data';
    if (
      capability.writeSchema !== undefined &&
      !policy.allowedWriteSchemaVersions.includes(capability.writeSchema)
    )
      return 'writer-prohibited';
  }
  return null;
}
export function preparePublication(
  raw: unknown,
  current: unknown | null,
  expectedRevision: number | null,
  client: ClientCapabilities,
): CompatibilityContract {
  const candidate = decodeContract(raw);
  const reason = evaluateCompatibility(candidate, client);
  if (reason) invalid('candidate-incompatible');
  if (expectedRevision === null) {
    if (current !== null || candidate.revision !== 1)
      invalid('publication-conflict');
  } else {
    positive(expectedRevision);
    if (
      current === null ||
      decodeContract(current).revision !== expectedRevision ||
      candidate.revision !== expectedRevision + 1
    )
      invalid('publication-conflict');
    const previous = decodeContract(current);
    if (candidate.serverRelease < previous.serverRelease)
      invalid('server-release-regression');
    for (const [name, family] of Object.entries(previous.recordFamilies)) {
      if (
        family.presentSchemaVersions.some(
          (v) =>
            !candidate.recordFamilies[name]?.presentSchemaVersions.includes(v),
        )
      )
        invalid('retained-schema-removal');
    }
  }
  return candidate;
}
