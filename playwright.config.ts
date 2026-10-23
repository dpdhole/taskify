import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    browserName: 'chromium',
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command:
        '"' +
        process.execPath +
        '" node_modules/vite/bin/vite.js --mode session-test --host 127.0.0.1 --port 5176 --strictPort',
      url: 'http://127.0.0.1:5176',
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command:
        '"' +
        process.execPath +
        '" node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4175 --strictPort --outDir dist-compatibility',
      url: 'http://127.0.0.1:4175',
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command:
        '"' +
        process.execPath +
        '" node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort --outDir dist-proof',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command:
        '"' +
        process.execPath +
        '" node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4174 --strictPort',
      url: 'http://127.0.0.1:4174',
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command:
        '"' +
        process.execPath +
        '" node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: false,
      timeout: 30000,
    },
  ],
});
