import { spawn } from 'node:child_process';
import path from 'node:path';
const child = spawn(
  process.execPath,
  ['node_modules/@playwright/test/cli.js', 'install', 'chromium'],
  {
    env: {
      ...process.env,
      PLAYWRIGHT_BROWSERS_PATH: path.resolve('.local/browsers'),
    },
    stdio: 'inherit',
  },
);
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
