import { expect, it } from 'vitest';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import {
  APP_VERSION,
  clientCapabilities,
} from '../../src/app/client-capabilities';
import {
  decodeContract,
  evaluateCompatibility,
} from '../../src/domain/compatibility';
import { capabilities } from '../support/compatibility-fixtures';
const candidate = decodeContract(
  JSON.parse(fs.readFileSync('config/workspace-compatibility.json', 'utf8')),
);
it('keeps package, public client and approved policy versions aligned', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
  expect([
    pkg.version,
    lock.version,
    lock.packages[''].version,
    candidate.minAppVersion,
    candidate.maxAppVersion,
  ]).toEqual(Array(5).fill(APP_VERSION));
});
it('admits the actual workspace release and retires the previous published client', () => {
  const client = clientCapabilities(
    candidate.environmentId,
    'release-test',
    true,
  );
  expect(evaluateCompatibility(candidate, client)).toBeNull();
  expect(client.families.accountDeletion?.writeSchema).toBe(1);
  expect(
    evaluateCompatibility(candidate, {
      ...capabilities,
      environmentId: candidate.environmentId,
    }),
  ).toBe('client-too-old');
});
it('validates the actual workspace candidate through the standalone operator CLI', () => {
  const run = (profile: string) =>
    spawnSync(
      process.execPath,
      [
        'tools/publish-compatibility.mjs',
        '--candidate',
        'config/workspace-compatibility.json',
        '--rules-profile',
        profile,
      ],
      { encoding: 'utf8' },
    );
  const valid = run('workspace');
  expect(valid.status, valid.stderr).toBe(0);
  expect(JSON.parse(valid.stdout)).toMatchObject({
    validated: true,
    revision: 3,
    cloudChanged: false,
  });
  const invalid = run('unreviewed');
  expect(invalid.status).not.toBe(0);
  expect(invalid.stderr).toContain('Unknown Rules profile');
});
