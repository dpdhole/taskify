import { spawn } from 'node:child_process';
import path from 'node:path';
if (
  process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080' ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9099'
)
  throw Error('Run through the checked local emulator runner');
async function run(file, args = []) {
  const child = spawn(process.execPath, [file, ...args], {
    env: {
      ...process.env,
      PLAYWRIGHT_BROWSERS_PATH: path.resolve('.local/browsers'),
    },
    stdio: 'inherit',
  });
  const code = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', resolve);
  });
  if (code !== 0) throw Error(file + ' failed with ' + code);
}
await run('node_modules/vitest/vitest.mjs', [
  'run',
  '--config',
  'vitest.integration.config.ts',
]);
await run('node_modules/@playwright/test/cli.js', ['test']);
