const regression = process.env.TASKIFY_WORKSPACE_REGRESSION === '1';
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: regression
    ? [
        'workspace.spec.ts',
        'session.spec.ts',
        'shared-auth-firestore.spec.ts',
        'redirect-startup.spec.ts',
      ]
    : 'workspace.spec.ts',
  workers: 1,
  retries: 0,
  timeout: 60000,
  reporter: 'list',
  use: { browserName: 'chromium', headless: true, trace: 'retain-on-failure' },
  webServer: [
    {
      command:
        '"' +
        process.execPath +
        '" node_modules/vite/bin/vite.js --mode session-test --host 127.0.0.1 --port 5177 --strictPort',
      url: 'http://127.0.0.1:5177/tests/support/workspace.html',
      reuseExistingServer: false,
      timeout: 30000,
    },
    ...(regression
      ? [
          {
            command:
              '"' +
              process.execPath +
              '" node_modules/vite/bin/vite.js --mode session-test --host 127.0.0.1 --port 5176 --strictPort',
            url: 'http://127.0.0.1:5176',
            reuseExistingServer: false,
            timeout: 30000,
          },
        ]
      : []),
  ],
});
