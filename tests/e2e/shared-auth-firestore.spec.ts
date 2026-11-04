import fs from 'node:fs';
import { test, expect } from '@playwright/test';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import type { SessionFixture } from '../support/session-browser-fixture';
import { contract } from '../support/compatibility-fixtures';
import { toFields } from '../../tools/publish-compatibility.mjs';
let environment: RulesTestEnvironment;
test.beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'demo-taskify-session',
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: fs.readFileSync('tests/support/compatibility-write.rules', 'utf8'),
    },
  });
});
test.afterAll(async () => {
  await environment?.cleanup();
});
test('shared Auth and Firestore settle provider checks without primary token notifications or a recovery loop', async ({
  page,
  request,
  context,
}) => {
  // Match the other SDK emulator fixtures: avoid delayed third-party UI assets.
  await context.route('**/*', (route) =>
    [
      'http://127.0.0.1:5176',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:9099',
      'https://apis.google.com',
    ].includes(new URL(route.request().url()).origin)
      ? route.continue()
      : route.abort(),
  );
  const seeded = await request.patch(
    'http://127.0.0.1:8080/v1/projects/demo-taskify-session/databases/(default)/documents/runtime/compatibility',
    {
      headers: { Authorization: 'Bearer owner' },
      data: { fields: toFields(contract()) },
    },
  );
  expect(seeded.ok()).toBe(true);
  await page.goto('http://127.0.0.1:5176');
  await page.evaluate(async () => {
    const url = '/tests/support/session-browser-fixture.ts';
    const module: {
      createSessionFixture: (serverCompatibility: boolean) => SessionFixture;
    } = await import(url);
    window.sessionFixture = module.createSessionFixture(true);
  });
  await expect
    .poll(() => page.evaluate(() => window.sessionFixture.state().canSignIn))
    .toBe(true);
  const loginEvent = page.waitForEvent('popup');
  await page
    .getByRole('button', { name: 'Continue with Google', exact: true })
    .click();
  const login = await loginEvent;
  await expect(login.locator('#title')).toBeVisible();
  const add = login.getByRole('button', { name: 'Add new account' });
  if (await add.isVisible()) await add.click();
  await login
    .locator('#email-input')
    .fill('shared-runtime-popup@example.invalid');
  await login
    .locator('#display-name-input')
    .fill('Synthetic shared-runtime user');
  await login.locator('#sign-in').click();
  await expect
    .poll(() =>
      page.evaluate(() => window.sessionFixture.state().protectedReady),
    )
    .toBe(true);
  const baseline = await page.evaluate(() =>
    window.sessionFixture.diagnostics(),
  );
  let lookups = 0;
  page.on('request', (r) => {
    if (r.url().includes('accounts:lookup')) lookups++;
  });
  await page
    .getByRole('button', { name: 'Sign-in methods', exact: true })
    .click();
  await expect(
    page.getByText('Sign-in methods verified.', { exact: true }),
  ).toBeVisible();
  for (let i = 0; i < 2; i++) {
    await page
      .getByRole('button', { name: 'Refresh sign-in methods', exact: true })
      .click();
    await expect(
      page.getByText('Sign-in methods verified.', { exact: true }),
    ).toBeVisible();
  }
  const after = await page.evaluate(() => window.sessionFixture.diagnostics());
  expect(after.primaryTokenEvents).toBe(baseline.primaryTokenEvents);
  expect(after.gate.generation).toBe(baseline.gate.generation);
  expect(lookups).toBe(3);
  expect(after.contracts?.activeListeners).toBe(1);
  const popupPromise = page.waitForEvent('popup');
  await page
    .getByRole('button', { name: 'Verify with Google', exact: true })
    .click();
  const popup = await popupPromise;
  await expect(popup.locator('#title')).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await popup
    .getByText('shared-runtime-popup@example.invalid', { exact: true })
    .click();
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(
    page.getByText('Current account verified. No sign-in method was added.', {
      exact: true,
    }),
  ).toBeVisible();
  expect(lookups).toBeLessThanOrEqual(7);
  await page.evaluate(() => window.sessionFixture.dispose());
});
