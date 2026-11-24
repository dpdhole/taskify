import { createHash } from 'node:crypto';
import { applicationDefault } from 'firebase-admin/app';
import { decodeContract } from '../../src/domain/compatibility';
import {
  assertDeletionCollection,
  deletionInventoryFamily,
} from '../../src/domain/account-deletion-inventory';
import { OperatorError } from './operator';
import type { OperatorPort } from './operator';
import { retirementCanary } from './retirement-canary-plan';

export async function verifyCanaryCloud(port: OperatorPort) {
  const { target, ruleset, rulesSha256 } = retirementCanary;
  await port.verifyProject(target);
  const policy = decodeContract((await port.get('runtime/compatibility')).data);
  if (
    policy.revision !== 3 ||
    policy.serverRelease !== 3 ||
    policy.minAppVersion !== '0.3.0' ||
    policy.maxAppVersion !== '0.3.0'
  )
    throw new OperatorError('invalid-target');
  const token = await applicationDefault().getAccessToken();
  async function get(path: string) {
    const response = await fetch(
      `https://firebaserules.googleapis.com/v1/${path}`,
      {
        headers: { Authorization: `Bearer ${token.access_token}` },
        redirect: 'error',
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!response.ok) throw new OperatorError('invalid-target');
    return response.json();
  }
  const release = await get(
    `projects/${target.project}/releases/cloud.firestore`,
  );
  if (release.rulesetName !== ruleset)
    throw new OperatorError('invalid-target');
  const files = (await get(ruleset)).source?.files;
  if (
    !Array.isArray(files) ||
    files.length !== 1 ||
    typeof files[0]?.content !== 'string'
  )
    throw new OperatorError('invalid-target');
  const actual = createHash('sha256')
    .update(files[0].content.replaceAll('\r\n', '\n'))
    .digest('hex');
  if (actual !== rulesSha256) throw new OperatorError('invalid-target');
  return {
    revision: policy.revision,
    serverRelease: policy.serverRelease,
    ruleset,
    rulesSha256,
  };
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, item]) => [key, canonical(item)]),
    );
  return value;
}

export async function snapshotCanaryComparison(port: OperatorPort) {
  const uid = retirementCanary.comparisonUid;
  const auth = await port.auth(uid);
  if (!auth || (await port.get(`accountDeletion/${uid}`)).exists)
    throw new OperatorError('reconciliation-required');
  const root = `users/${uid}`;
  const records: [string, unknown][] = [];
  async function walk(path: string) {
    deletionInventoryFamily(uid, path);
    const snap = await port.get(path);
    if (snap.exists) records.push([path, canonical(snap.data)]);
    for (const collection of (await port.collections(path)).sort()) {
      assertDeletionCollection(uid, collection);
      if (!collection.startsWith(path + '/'))
        throw new OperatorError('invalid-target');
      for (const child of (await port.documents(collection)).sort()) {
        if (
          !child.startsWith(collection + '/') ||
          child.split('/').length !== collection.split('/').length + 1
        )
          throw new OperatorError('invalid-target');
        await walk(child);
      }
    }
  }
  await walk(root);
  if (!records.some(([path]) => path === `${root}/initialization/workspace`))
    throw new OperatorError('reconciliation-required');
  return {
    uid,
    documents: records.length,
    workspaceSha256: createHash('sha256')
      .update(JSON.stringify(records))
      .digest('hex'),
    authSha256: createHash('sha256').update(JSON.stringify(auth)).digest('hex'),
    fencePresent: false,
  };
}
