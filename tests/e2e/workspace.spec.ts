import { APP_VERSION } from '../../src/app/client-capabilities';
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { contract } from '../support/compatibility-fixtures';
import { WORKSPACE_SCHEMA_FAMILIES } from '../../src/domain/workspace-seeds';
const projectId = 'demo-taskify-provisioning-stage',
  uid = 'browser-owner';
let env: RulesTestEnvironment;
const policy = (revision = 1, minAppVersion = APP_VERSION) =>
  contract({
    environmentId: projectId,
    revision,
    minAppVersion,
    maxAppVersion: minAppVersion,
    recordFamilies: {
      ...contract().recordFamilies,
      ...Object.fromEntries(
        WORKSPACE_SCHEMA_FAMILIES.map((f) => [
          f,
          { presentSchemaVersions: [1], allowedWriteSchemaVersions: [1] },
        ]),
      ),
    },
  });
test.beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: fs.readFileSync('firestore.workspace.rules', 'utf8'),
    },
  });
});
test.beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled((c) =>
    setDoc(doc(c.firestore(), 'runtime/compatibility'), policy()),
  );
});
test.afterAll(async () => {
  await env?.cleanup();
});
const url = 'http://127.0.0.1:5177/tests/support/workspace.html';
for (const width of [390, 1280])
  test(
    'single-provider workspace setup, reload and Logout at ' + width,
    async ({ page }) => {
      await page.setViewportSize({ width, height: 850 });
      await page.goto(url);
      await expect(
        page.getByRole('heading', { name: 'Workspace ready', exact: true }),
      ).toBeVisible({ timeout: 30000 });
      await expect(
        page.getByText('Browser profile', { exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(() => window.workspaceFixture.stageCalls()),
      ).toHaveLength(24);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.evaluate(() => window.workspaceFixture.providerChanged());
      await expect(page.getByText('Changed provider profile')).toHaveCount(0);
      await page.reload();
      await expect(
        page.getByRole('heading', { name: 'Workspace ready', exact: true }),
      ).toBeVisible({ timeout: 30000 });
      expect(
        await page.evaluate(() => window.workspaceFixture.stageCalls()),
      ).toEqual([]);
      await page.getByRole('button', { name: 'Logout', exact: true }).click();
      await expect(
        page.getByText('Browser profile', { exact: true }),
      ).toHaveCount(0);
      expect(
        await page.evaluate(() => window.workspaceFixture.state().profileName),
      ).toBeNull();
    },
  );
test('invalid timezone requires explicit recovery and never silently writes UTC', async ({
  page,
}) => {
  await page.goto(url + '?timezone=Invalid%2FZone');
  await expect(
    page.getByRole('heading', { name: 'Choose your timezone' }),
  ).toBeVisible();
  await env.withSecurityRulesDisabled(async (c) => {
    expect(
      (
        await getDoc(
          doc(c.firestore(), `users/${uid}/initialization/workspace`),
        )
      ).exists(),
    ).toBe(false);
  });
  await page
    .getByLabel('Timezone', { exact: true })
    .selectOption('Asia/Kolkata');
  await page
    .getByRole('button', { name: 'Continue setup', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Workspace ready', exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await expect(page.getByText('Timezone: Asia/Kolkata')).toBeVisible();
});
test('invalid optional profile requires explicit omission, then setup can finish', async ({
  page,
}) => {
  await page.goto(url + '?badProfile=1');
  await expect(
    page.getByRole('heading', { name: 'Profile details need attention' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Continue without profile details' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Workspace ready', exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await env.withSecurityRulesDisabled(async (c) => {
    expect(
      (await getDoc(doc(c.firestore(), `users/${uid}/profile/main`))).data()
        ?.displayName,
    ).toBeUndefined();
  });
});
test('lost acknowledgement is checked before resuming without replaying the committed stage', async ({
  page,
}) => {
  await page.goto(url + '?lostAck=1');
  await expect(
    page.getByRole('heading', { name: 'Setup needs checking' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Check setup status', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Workspace ready', exact: true }),
  ).toBeVisible({ timeout: 30000 });
  expect(
    (await page.evaluate(() => window.workspaceFixture.stageCalls())).filter(
      (index) => index === 1,
    ),
  ).toHaveLength(1);
  await env.withSecurityRulesDisabled(async (c) => {
    expect(
      (await getDocs(collection(c.firestore(), `users/${uid}/categories`)))
        .size,
    ).toBe(12);
  });
});
test('compatibility revocation stops writes, then fresh admission resumes committed progress', async ({
  page,
}) => {
  await page.goto(url + '?pause=1');
  await expect
    .poll(() =>
      page.evaluate(() => window.workspaceFixture.stageCalls().includes(1)),
    )
    .toBe(true);
  await env.withSecurityRulesDisabled((c) =>
    setDoc(doc(c.firestore(), 'runtime/compatibility'), policy(2, '99.0.0')),
  );
  await expect(
    page.getByText(
      'Waiting for verified session, connection and compatibility.',
    ),
  ).toBeVisible();
  await page.evaluate(() => window.workspaceFixture.release());
  await env.withSecurityRulesDisabled(async (c) => {
    expect(
      (
        await getDoc(
          doc(c.firestore(), `users/${uid}/initializationStages/categories-01`),
        )
      ).exists(),
    ).toBe(false);
  });
  await env.withSecurityRulesDisabled((c) =>
    setDoc(doc(c.firestore(), 'runtime/compatibility'), policy(3)),
  );
  await expect(
    page.getByRole('heading', { name: 'Workspace ready', exact: true }),
  ).toBeVisible({ timeout: 30000 });
});
test('deletion fence blocks setup and hides workspace content while preserving Logout', async ({
  page,
}) => {
  await env.withSecurityRulesDisabled((c) =>
    setDoc(doc(c.firestore(), `accountDeletion/${uid}`), {
      schemaVersion: 99,
      state: 'unknown',
    }),
  );
  await page.goto(url);
  await expect(
    page.getByRole('heading', { name: 'Account deletion in progress' }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => window.workspaceFixture.stageCalls()),
  ).toEqual([]);
  await expect(
    page.getByRole('button', { name: 'Logout', exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole('heading', { name: 'Workspace ready', exact: true }),
  ).toHaveCount(0);
});

for (const provider of ['Google', 'Microsoft'])
  test(
    'real SDK ' +
      provider +
      ' emulator sign-in provisions on the shared database and survives reload',
    async ({ page, context }) => {
      await context.route('**/*', (route) => {
        const origin = new URL(route.request().url()).origin;
        return [
          'http://127.0.0.1:5177',
          'http://127.0.0.1:8080',
          'http://127.0.0.1:9099',
          'https://apis.google.com',
        ].includes(origin)
          ? route.continue()
          : route.abort();
      });
      const origins = new Set<string>();
      page.on('request', (request) =>
        origins.add(new URL(request.url()).origin),
      );
      await page.goto(url + '?sdkAuth=1');
      const opened = page.waitForEvent('popup');
      await page
        .getByRole('button', { name: 'Continue with ' + provider, exact: true })
        .click();
      const popup = await opened;
      await expect(popup.locator('#title')).toBeVisible();
      const add = popup.getByRole('button', { name: 'Add new account' });
      if (await add.isVisible()) await add.click();
      await popup
        .locator('#email-input')
        .fill('workspace-' + provider.toLowerCase() + '@example.invalid');
      await popup.locator('#display-name-input').fill('Workspace ' + provider);
      await popup.locator('#sign-in').click();
      await expect
        .poll(() => page.evaluate(() => window.workspaceFixture.authAudience()))
        .toBe(projectId);
      await expect(
        page.getByRole('heading', { name: 'Workspace ready', exact: true }),
      ).toBeVisible({ timeout: 30000 });
      const identity = await page.evaluate(() =>
        window.workspaceFixture.sessionUid(),
      );
      expect(identity).toBeTruthy();
      await page.reload();
      await expect(
        page.getByRole('heading', { name: 'Workspace ready', exact: true }),
      ).toBeVisible({ timeout: 30000 });
      expect(
        await page.evaluate(() => window.workspaceFixture.sessionUid()),
      ).toBe(identity);
      expect(
        await page.evaluate(() => window.workspaceFixture.stageCalls()),
      ).toEqual([]);
      await page.getByRole('button', { name: 'Logout', exact: true }).click();
      await expect(
        page.getByRole('heading', { name: 'Workspace ready', exact: true }),
      ).toHaveCount(0);
      expect(
        [...origins].every((origin) =>
          [
            'http://127.0.0.1:5177',
            'http://127.0.0.1:8080',
            'http://127.0.0.1:9099',
            'ws://127.0.0.1:5177',
            'https://apis.google.com',
            // These emulator UI resources are attempted but blocked by context.route.
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://unpkg.com',
          ].includes(origin),
        ),
      ).toBe(true);
    },
  );
