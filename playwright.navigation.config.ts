import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: 'navigation.spec.ts',
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5180',
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
  webServer: {
    command:
      '"' +
      process.execPath +
      '" node_modules/vite/bin/vite.js --mode navigation-test --port 5180 --host 127.0.0.1 --strictPort',
    url: 'http://127.0.0.1:5180',
    reuseExistingServer: false,
  },
});
