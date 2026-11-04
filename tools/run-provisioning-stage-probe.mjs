/** Isolated synthetic Rules probe; never deploys or stops existing services. */
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
async function execute(file, args, env) {
  const child = spawn(file, args, { cwd: root, env, stdio: 'inherit' });
  const interrupt = () => child.kill('SIGINT');
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);
  try {
    const code = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('exit', resolve);
    });
    process.exitCode = typeof code === 'number' ? code : 1;
  } finally {
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
  }
}
if (process.argv[2] === '--tests') {
  if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080')
    throw Error('Checked loopback emulator required');
  await execute(
    process.execPath,
    [
      'node_modules/vitest/vitest.mjs',
      'run',
      '--config',
      'vitest.integration.config.ts',
      'tests/integration/provisioning-stage-probe.test.ts',
      ...(process.env.TASKIFY_PROVISIONING_POLICY === 'production'
        ? ['tests/integration/workspace-rules.test.ts']
        : []),
    ],
    process.env,
  );
} else {
  const production = process.argv[2] === '--production';
  if (
    (!production && process.argv.length !== 2) ||
    (production && process.argv.length !== 3)
  )
    throw Error('Unexpected probe arguments');
  const config = JSON.parse(fs.readFileSync('firebase.local.json', 'utf8'));
  for (const [service, port] of Object.entries({
    firestore: 8080,
    hub: 4400,
    logging: 4500,
  })) {
    if (
      config.emulators[service]?.host !== '127.0.0.1' ||
      config.emulators[service]?.port !== port
    )
      throw Error('Unexpected local emulator configuration');
  }
  for (const port of [8080, 4400, 4500, 9150]) {
    await new Promise((resolve, reject) => {
      const server = net.createServer();
      server.once('error', () =>
        reject(
          Error('Port ' + port + ' occupied; existing owner left untouched'),
        ),
      );
      server.listen(port, '127.0.0.1', () => server.close(resolve));
    });
  }
  const javaName = process.platform === 'win32' ? 'java.exe' : 'java';
  const homes = [process.env.TASKIFY_JAVA_HOME, process.env.JAVA_HOME].filter(
    Boolean,
  );
  if (
    process.env.TASKIFY_JAVA_HOME &&
    !fs.existsSync(path.join(process.env.TASKIFY_JAVA_HOME, 'bin', javaName))
  )
    throw Error('Invalid TASKIFY_JAVA_HOME');
  const sibling = path.resolve(root, '../gate1/java21');
  if (fs.existsSync(sibling))
    for (const dir of fs.readdirSync(sibling))
      homes.push(path.join(sibling, dir));
  const java =
    homes
      .map((home) => path.join(home, 'bin', javaName))
      .find((file) => fs.existsSync(file)) ?? 'java';
  const checked = spawnSync(java, ['-version'], { encoding: 'utf8' });
  const version = (checked.stderr ?? '') + (checked.stdout ?? '');
  const major = Number(version.match(/version "(\d+)/)?.[1]);
  if (checked.status !== 0 || !Number.isInteger(major) || major < 21)
    throw Error('Java21+ required');
  const env = {
    ...process.env,
    CI: 'true',
    TASKIFY_PROVISIONING_POLICY: production ? 'production' : 'probe',
    FIREBASE_CLI_DISABLE_UPDATE_CHECK: 'true',
    FIREBASE_EMULATORS_PATH: path.resolve('.local/emulators'),
  };
  const originalPath =
    Object.entries(env).find(([key]) => key.toLowerCase() === 'path')?.[1] ??
    '';
  for (const key of Object.keys(env))
    if (key.toLowerCase() === 'path') delete env[key];
  env.PATH = [
    path.dirname(process.execPath),
    ...(java === 'java' ? [] : [path.dirname(java)]),
    originalPath,
  ].join(path.delimiter);
  if (java !== 'java') env.JAVA_HOME = path.dirname(path.dirname(java));
  console.log(
    'Synthetic stage-integrity probe; loopback Firestore only; preview5173 untouched',
  );
  const command =
    '"' +
    process.execPath.replaceAll('\\', '/') +
    '" tools/run-provisioning-stage-probe.mjs --tests';
  await execute(
    process.execPath,
    [
      'node_modules/firebase-tools/lib/bin/firebase.js',
      'emulators:exec',
      '--config',
      'firebase.local.json',
      '--project',
      'demo-taskify-provisioning-stage',
      '--only',
      'firestore',
      command,
    ],
    env,
  );
}
