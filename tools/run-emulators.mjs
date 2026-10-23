import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const config = JSON.parse(fs.readFileSync('firebase.local.json', 'utf8'));
const expectedPorts = {
  firestore: 8080,
  auth: 9099,
  hosting: 5000,
  hub: 4400,
  logging: 4500,
};
const services = Object.keys(expectedPorts);
if (config.functions || config.emulators.pubsub)
  throw Error('Unexpected service');
async function free(port) {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once('error', () =>
      reject(Error('Port ' + port + ' is in use; stop its owner explicitly')),
    );
    s.listen(port, '127.0.0.1', () => s.close(resolve));
  });
}
for (const name of services) {
  const service = config.emulators[name];
  if (service.host !== '127.0.0.1' || service.port !== expectedPorts[name])
    throw Error('Nonlocal emulator configuration');
  await free(service.port);
}
for (const port of [4173, 4174, 4175, 5173, 5176, 9150]) await free(port);
if (
  process.env.TASKIFY_JAVA_HOME &&
  !fs.existsSync(
    path.join(
      process.env.TASKIFY_JAVA_HOME,
      'bin',
      process.platform === 'win32' ? 'java.exe' : 'java',
    ),
  )
)
  throw Error('TASKIFY_JAVA_HOME does not contain Java');
const suffix = process.platform === 'win32' ? 'java.exe' : 'java';
const homes = [process.env.TASKIFY_JAVA_HOME, process.env.JAVA_HOME].filter(
  Boolean,
);
const sibling = path.resolve(root, '../gate1/java21');
if (fs.existsSync(sibling))
  for (const name of fs.readdirSync(sibling))
    homes.push(path.join(sibling, name));
let java =
  homes
    .map((home) => path.join(home, 'bin', suffix))
    .find((f) => fs.existsSync(f)) ?? 'java';
const checked = spawnSync(java, ['-version'], { encoding: 'utf8' });
const version = (checked.stderr ?? '') + (checked.stdout ?? '');
const major = Number(version.match(/version "(\d+)/)?.[1]);
if (checked.status !== 0 || !Number.isInteger(major) || major < 21)
  throw Error('Java21+ required; set TASKIFY_JAVA_HOME');
const env = {
  ...process.env,
  CI: 'true',
  FIREBASE_CLI_DISABLE_UPDATE_CHECK: 'true',
  FIREBASE_EMULATORS_PATH: path.resolve('.local/emulators'),
  PLAYWRIGHT_BROWSERS_PATH: path.resolve('.local/browsers'),
};
const originalPath =
  Object.entries(env).find(([key]) => key.toLowerCase() === 'path')?.[1] ?? '';
for (const key of Object.keys(env))
  if (key.toLowerCase() === 'path') delete env[key];
env.PATH = [
  path.dirname(process.execPath),
  ...(java === 'java' ? [] : [path.dirname(java)]),
  originalPath,
].join(path.delimiter);
if (java !== 'java') env.JAVA_HOME = path.dirname(path.dirname(java));
console.log(
  'Local demo project; Java ' +
    major +
    '; CLI ' +
    JSON.parse(fs.readFileSync('node_modules/firebase-tools/package.json'))
      .version,
);
const child = spawn(
  process.execPath,
  [
    'node_modules/firebase-tools/lib/bin/firebase.js',
    'emulators:exec',
    '--config',
    'firebase.local.json',
    '--project',
    'demo-taskify-foundation',
    '--only',
    'firestore,auth,hosting',
    '"' +
      process.execPath.replaceAll('\\', '/') +
      '" tools/run-local-tests.mjs',
  ],
  { cwd: root, env, stdio: 'inherit' },
);
const interrupt = () => child.kill('SIGINT');
process.once('SIGINT', interrupt);
process.once('SIGTERM', interrupt);
const code = await new Promise((resolve, reject) => {
  child.once('error', reject);
  child.once('exit', resolve);
});
process.removeListener('SIGINT', interrupt);
process.removeListener('SIGTERM', interrupt);
// emulators:exec owns its descendants and shuts them down on success/failure.
process.exitCode = typeof code === 'number' ? code : 1;
