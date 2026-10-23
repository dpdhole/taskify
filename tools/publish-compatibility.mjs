import fs from 'node:fs';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import {
  decodeContract,
  preparePublication,
} from '../src/domain/compatibility.ts';
import { clientCapabilities } from '../src/app/client-capabilities.ts';
const require = createRequire(import.meta.url);
export const target = {
  projectId: 'taskify-dev-dpdhole',
  projectNumber: '243252492098',
  database: '(default)',
};
export function validateTarget(project, billing) {
  if (
    project.projectId !== target.projectId ||
    String(project.projectNumber) !== target.projectNumber ||
    project.state !== 'ACTIVE'
  )
    throw Error('Project identity mismatch');
  if (billing.billingEnabled || billing.billingAccountName)
    throw Error('Free-only billing precondition failed');
}
export function toFields(value) {
  return Object.fromEntries(
    Object.entries(value).map(([key, v]) => [key, encode(v)]),
  );
}
function encode(v) {
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'number' && Number.isSafeInteger(v))
    return { integerValue: String(v) };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encode) } };
  if (v && typeof v === 'object') return { mapValue: { fields: toFields(v) } };
  throw Error('Unsupported contract value');
}
export function fromFields(fields) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, v]) => [key, decode(v)]),
  );
}
function decode(v) {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decode);
  if ('mapValue' in v) return fromFields(v.mapValue.fields || {});
  throw Error('Unsupported persisted contract value');
}
export async function publishCandidate(
  api,
  candidate,
  expectedRevision,
  client,
) {
  const transaction = (
    await api.post(
      '/projects/' +
        target.projectId +
        '/databases/(default)/documents:beginTransaction',
      { options: { readWrite: {} } },
    )
  ).body.transaction;
  if (!transaction) throw Error('Missing transaction token');
  const name =
    'projects/' +
    target.projectId +
    '/databases/(default)/documents/runtime/compatibility';
  try {
    let current = null;
    try {
      current = (await api.get('/' + name, { queryParams: { transaction } }))
        .body;
    } catch (e) {
      if (e.status !== 404) throw e;
    }
    const result = preparePublication(
      candidate,
      current ? fromFields(current.fields) : null,
      expectedRevision,
      client,
    );
    const precondition = current
      ? { updateTime: current.updateTime }
      : { exists: false };
    if (current && !current.updateTime)
      throw Error('Missing concurrency token');
    await api.post(
      '/projects/' + target.projectId + '/databases/(default)/documents:commit',
      {
        transaction,
        writes: [
          {
            update: { name, fields: toFields(result) },
            currentDocument: precondition,
          },
        ],
      },
    );
    const verified = decodeContract(
      fromFields((await api.get('/' + name)).body.fields),
    );
    if (JSON.stringify(verified) !== JSON.stringify(result))
      throw Error(
        'Published policy changed before verification; inspect before any retry',
      );
    return result;
  } catch (error) {
    try {
      await api.post(
        '/projects/' +
          target.projectId +
          '/databases/(default)/documents:rollback',
        { transaction },
      );
    } catch {
      /* Preserve original/unknown commit outcome. */
    }
    throw error;
  }
}
async function main(args) {
  if (!args.length || args.includes('--help')) {
    console.log(
      'Validate: node tools/publish-compatibility.mjs --candidate FILE\nPublish: add --apply --account EMAIL --bootstrap OR --expected-revision N; project is pinned. No login prompts or automatic retries.',
    );
    return;
  }
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (
      ![
        '--candidate',
        '--apply',
        '--account',
        '--bootstrap',
        '--expected-revision',
      ].includes(key) ||
      key in options
    )
      throw Error('Unknown or duplicated option');
    if (['--apply', '--bootstrap'].includes(key)) options[key] = true;
    else {
      if (!args[i + 1] || args[i + 1].startsWith('--'))
        throw Error('Missing option value');
      options[key] = args[++i];
    }
  }
  if (!options['--candidate']) throw Error('Candidate file is required');
  const candidate = decodeContract(
    JSON.parse(fs.readFileSync(options['--candidate'], 'utf8')),
  );
  const client = clientCapabilities(target.projectId, 'operator-validation');
  const contractSha256 = crypto
    .createHash('sha256')
    .update(JSON.stringify(candidate))
    .digest('hex');
  if (!options['--apply']) {
    preparePublication({ ...candidate, revision: 1 }, null, null, client);
    console.log(
      JSON.stringify({
        validated: true,
        contractSha256,
        revision: candidate.revision,
        cloudChanged: false,
      }),
    );
    return;
  }
  const bootstrap = Boolean(options['--bootstrap']);
  const revision = options['--expected-revision'];
  if (bootstrap === Boolean(revision) || !options['--account'])
    throw Error(
      'Explicit account and exactly one revision precondition are required',
    );
  const expected = bootstrap ? null : Number(revision);
  if (
    !bootstrap &&
    (!/^[1-9]\d*$/.test(revision) || !Number.isSafeInteger(expected))
  )
    throw Error('Invalid expected revision');
  const account = require('firebase-tools/lib/auth')
    .getAllAccounts()
    .find((a) => a.user.email === options['--account']);
  if (!account)
    throw Error(
      'Account not signed in. Obtain explicit permission before an interactive login.',
    );
  await require('firebase-tools/lib/requireAuth').requireAuth({
    project: target.projectId,
    user: account.user,
    tokens: account.tokens,
    nonInteractive: true,
  });
  const { Client } = require('firebase-tools/lib/apiv2');
  const project =
    await require('firebase-tools/lib/management/projects').getFirebaseProject(
      target.projectId,
    );
  const billing = (
    await new Client({
      urlPrefix: 'https://cloudbilling.googleapis.com',
      apiVersion: 'v1',
    }).get('/projects/' + target.projectId + '/billingInfo')
  ).body;
  validateTarget(project, billing);
  const rules = new Client({
    urlPrefix: 'https://firebaserules.googleapis.com',
    apiVersion: 'v1',
  });
  const release = (
    await rules.get(
      '/projects/' + target.projectId + '/releases/cloud.firestore',
    )
  ).body;
  const ruleset = (await rules.get('/' + release.rulesetName)).body;
  const files = ruleset.source?.files || [];
  const localSource = fs
    .readFileSync('firestore.compatibility.rules', 'utf8')
    .replaceAll('\r\n', '\n');
  if (
    files.length !== 1 ||
    files[0].content.replaceAll('\r\n', '\n') !== localSource
  )
    throw Error(
      'Deployed Rules do not match reviewed compatibility-only Rules',
    );
  const api = new Client({
    urlPrefix: 'https://firestore.googleapis.com',
    apiVersion: 'v1',
  });
  const result = await publishCandidate(api, candidate, expected, client);
  const evidence = {
    publishedAt: new Date().toISOString(),
    projectId: target.projectId,
    projectNumber: target.projectNumber,
    expectedRevision: expected,
    revision: result.revision,
    serverRelease: result.serverRelease,
    contractSha256,
    rulesetName: release.rulesetName,
    rulesSourceSha256: crypto
      .createHash('sha256')
      .update(localSource)
      .digest('hex'),
    verified: true,
  };
  fs.mkdirSync('.local/compatibility', { recursive: true });
  fs.writeFileSync(
    '.local/compatibility/publication.json',
    JSON.stringify(evidence, null, 2) + '\n',
  );
  console.log(JSON.stringify(evidence, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main(process.argv.slice(2)).catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
