import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';

const config = JSON.parse(fs.readFileSync('firebase.hosting.json', 'utf8'));
if (
  Object.keys(config).join() !== 'hosting' ||
  config.hosting.site !== 'taskify-dev-dpdhole' ||
  config.hosting.public !== 'dist' ||
  config.hosting.rewrites.some((r) => r.destination !== '/index.html')
)
  throw Error('Unexpected publication configuration');
for (const port of [5002, 4400, 4500]) {
  await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => server.close(resolve));
  });
}
// Validate the same Hosting policy using only a loopback demo project.
delete config.hosting.site;
config.hosting.public = '../../dist';
config.emulators = {
  hosting: { host: '127.0.0.1', port: 5002 },
  hub: { host: '127.0.0.1', port: 4400 },
  logging: { host: '127.0.0.1', port: 4500 },
  ui: { enabled: false },
  singleProjectMode: true,
};
fs.mkdirSync('.local/hosting-preflight', { recursive: true });
fs.writeFileSync(
  '.local/hosting-preflight/firebase.validation.json',
  JSON.stringify(config, null, 2) + '\n',
);
const env = {
  ...process.env,
  PLAYWRIGHT_BROWSERS_PATH: path.resolve('.local/browsers'),
  FIREBASE_CLI_DISABLE_UPDATE_CHECK: 'true',
};
const originalPath =
  Object.entries(env).find(([key]) => key.toLowerCase() === 'path')?.[1] ?? '';
for (const key of Object.keys(env))
  if (key.toLowerCase() === 'path') delete env[key];
env.PATH = path.dirname(process.execPath) + path.delimiter + originalPath;
const child = spawn(
  process.execPath,
  [
    'node_modules/firebase-tools/lib/bin/firebase.js',
    'emulators:exec',
    '--project',
    'demo-taskify-foundation',
    '--config',
    '.local/hosting-preflight/firebase.validation.json',
    '--only',
    'hosting',
    '"' +
      process.execPath.replaceAll('\\', '/') +
      '" tools/check-hosting.mjs' +
      (process.argv.includes('--expect-compatible')
        ? ' --expect-compatible'
        : ''),
  ],
  { env, stdio: 'inherit' },
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
process.exitCode = typeof code === 'number' ? code : 1;
