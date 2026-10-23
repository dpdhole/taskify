import { describe, it, expect } from 'vitest';
import {
  compareAppVersions,
  decodeContract,
  evaluateCompatibility,
  parseAppVersion,
  preparePublication,
} from '../../src/domain/compatibility';
import { capabilities, contract } from '../support/compatibility-fixtures';
describe('compatibility contract', () => {
  it.each(['0.0.0', '0.1.0', '1.10.123', '9007199254740991.0.0'])(
    'accepts canonical version %s',
    (v) => expect(parseAppVersion(v)).toHaveLength(3),
  );
  it.each([
    '01.0.0',
    '1.0',
    '1.0.0-beta',
    '1.0.0+build',
    '-1.0.0',
    '1.0.0 ',
    '9007199254740992.0.0',
    '1e2.0.0',
  ])('rejects malformed version %s', (v) =>
    expect(() => parseAppVersion(v)).toThrow(),
  );
  it('compares numerically and accepts inclusive app bounds', () => {
    expect(compareAppVersions('1.10.0', '1.9.9')).toBe(1);
    expect(
      evaluateCompatibility(decodeContract(contract()), capabilities),
    ).toBeNull();
    expect(
      evaluateCompatibility(
        decodeContract(
          contract({ minAppVersion: '0.1.1', maxAppVersion: '0.2.0' }),
        ),
        capabilities,
      ),
    ).toBe('client-too-old');
    expect(
      evaluateCompatibility(
        decodeContract(
          contract({ minAppVersion: '0.0.0', maxAppVersion: '0.0.9' }),
        ),
        capabilities,
      ),
    ).toBe('client-ahead');
  });
  it.each([
    null,
    {},
    contract({ revision: 0 }),
    contract({ serverRelease: NaN }),
    contract({ contractFormatVersion: 2 }),
    contract({ minAppVersion: '1.0.0', maxAppVersion: '0.1.0' }),
    contract({ recordFamilies: {} }),
    contract({
      recordFamilies: {
        compatibilityProbe: {
          presentSchemaVersions: [1, 1],
          allowedWriteSchemaVersions: [1],
        },
      },
    }),
    contract({
      recordFamilies: {
        compatibilityProbe: {
          presentSchemaVersions: [1],
          allowedWriteSchemaVersions: [2],
        },
      },
    }),
  ])('rejects invalid contract %#', (value) =>
    expect(() => decodeContract(value)).toThrow(),
  );
  it('rejects wrong environment and missing required families', () => {
    expect(() =>
      evaluateCompatibility(
        decodeContract(contract({ environmentId: 'other' })),
        capabilities,
      ),
    ).toThrow('wrong-environment');
    expect(() =>
      evaluateCompatibility(
        decodeContract(
          contract({
            recordFamilies: {
              other: {
                presentSchemaVersions: [1],
                allowedWriteSchemaVersions: [1],
              },
            },
          }),
        ),
        capabilities,
      ),
    ).toThrow('missing-family');
  });
  it('checks all retained schemas and chosen write schema, allowing unused valid families', () => {
    const policy = {
      compatibilityProbe: {
        presentSchemaVersions: [1, 2],
        allowedWriteSchemaVersions: [2],
      },
    };
    expect(
      evaluateCompatibility(
        decodeContract(contract({ recordFamilies: policy })),
        capabilities,
      ),
    ).toBe('unreadable-data');
    const reader = {
      ...capabilities,
      families: {
        compatibilityProbe: { readableSchemas: [1, 2], writeSchema: 1 },
      },
    };
    expect(
      evaluateCompatibility(
        decodeContract(contract({ recordFamilies: policy })),
        reader,
      ),
    ).toBe('writer-prohibited');
    const extended = {
      ...contract(),
      inert: 'future',
      recordFamilies: {
        ...contract().recordFamilies,
        unused: {
          presentSchemaVersions: [99],
          allowedWriteSchemaVersions: [99],
        },
      },
    };
    expect(
      evaluateCompatibility(decodeContract(extended), capabilities),
    ).toBeNull();
  });
  it('canonicalizes fields and ignores inert additions without mutating input', () => {
    const input = contract();
    expect(decodeContract({ ...input, inert: 1 })).toEqual(
      decodeContract(input),
    );
    expect(input.revision).toBe(1);
  });
});
describe('operator publication preconditions', () => {
  it('requires absence at bootstrap and expected revision thereafter', () => {
    expect(
      preparePublication(contract(), null, null, capabilities).revision,
    ).toBe(1);
    expect(() =>
      preparePublication(contract(), contract(), null, capabilities),
    ).toThrow('publication-conflict');
    expect(
      preparePublication(contract({ revision: 2 }), contract(), 1, capabilities)
        .revision,
    ).toBe(2);
    expect(() =>
      preparePublication(
        contract({ revision: 2 }),
        contract({ revision: 2 }),
        1,
        capabilities,
      ),
    ).toThrow('publication-conflict');
    expect(() =>
      preparePublication(
        contract({ revision: 1 }),
        contract(),
        1,
        capabilities,
      ),
    ).toThrow('publication-conflict');
  });
  it('does not drop retained schemas or regress policy generation', () => {
    const c = {
      ...capabilities,
      families: {
        compatibilityProbe: { readableSchemas: [1, 2], writeSchema: 1 },
      },
    };
    const previous = contract({
      recordFamilies: {
        compatibilityProbe: {
          presentSchemaVersions: [1, 2],
          allowedWriteSchemaVersions: [1],
        },
      },
    });
    expect(() =>
      preparePublication(contract({ revision: 2 }), previous, 1, c),
    ).toThrow('retained-schema-removal');
    expect(() =>
      preparePublication(
        contract({ revision: 2, serverRelease: 1 }),
        contract({ serverRelease: 2 }),
        1,
        c,
      ),
    ).toThrow('server-release-regression');
  });
});
