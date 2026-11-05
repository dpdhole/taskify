import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc } from 'firebase/firestore';
let env: RulesTestEnvironment;
const projectId = 'demo-taskify-provisioning-stage',
  uid = 'deletion-browser-owner';
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

for (const provider of ['Google', 'Microsoft'])
  test(`SDK ${provider} reauthentication transfers proof to shared Firestore`, async ({
    page,
    context,
  }) => {
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
    const email = `deletion-${crypto.randomUUID()}@example.invalid`;
    await page.goto(
      'http://127.0.0.1:5177/tests/support/workspace.html?sdkAuth&deletion',
    );
    const opened = page.waitForEvent('popup');
    await page
      .getByRole('button', { name: `Continue with ${provider}`, exact: true })
      .click();
    const popup = await opened;
    const add = popup.getByRole('button', { name: 'Add new account' });
    if (await add.isVisible()) await add.click();
    await popup.locator('#email-input').fill(email);
    await popup.locator('#display-name-input').fill('Deletion SDK account');
    await popup.locator('#sign-in').click();
    await expect(
      page.getByRole('heading', { name: 'Workspace ready', exact: true }),
    ).toBeVisible({ timeout: 30000 });
    const originalUid = await page.evaluate(() =>
      window.workspaceFixture.sessionUid(),
    );
    expect(originalUid).toBeTruthy();
    await page
      .getByRole('button', { name: 'Delete Account', exact: true })
      .click();
    await page
      .getByLabel('Type DELETE to confirm permanent loss')
      .fill('DELETE');
    const proofPopup = page.waitForEvent('popup');
    await page
      .getByRole('button', { name: `Verify with ${provider}`, exact: true })
      .click();
    const verify = await proofPopup;
    await expect(verify.getByText(email, { exact: true })).toBeVisible();
    await verify.getByText(email, { exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Request permanent deletion' }),
    ).toBeEnabled({ timeout: 30000 });
    expect(
      await page.evaluate(() => window.workspaceFixture.sessionUid()),
    ).toBe(originalUid);
    await page
      .getByRole('button', { name: 'Request permanent deletion' })
      .click();
    await expect(
      page.getByText('Deletion requested — awaiting operator processing', {
        exact: true,
      }),
    ).toBeVisible({ timeout: 30000 });
    await env.withSecurityRulesDisabled(async (c) => {
      const control = (
        await getDoc(doc(c.firestore(), `accountDeletion/${originalUid}`))
      ).data();
      expect(control?.proofProvider).toBe(
        provider === 'Google' ? 'google.com' : 'microsoft.com',
      );
      expect(control?.state).toBe('requested');
    });
  });
test.beforeEach(async () => {
  await env.clearFirestore();
  const policy = JSON.parse(
    fs.readFileSync('config/workspace-compatibility.json', 'utf8'),
  );
  await env.withSecurityRulesDisabled((c) =>
    setDoc(doc(c.firestore(), 'runtime/compatibility'), {
      ...policy,
      environmentId: projectId,
    }),
  );
});
test.afterAll(async () => {
  await env?.cleanup();
});
for (const width of [390, 1280])
  test(`confirmation, request, reload recovery and Logout at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto(
      'http://127.0.0.1:5177/tests/support/workspace.html?deletion&uid=deletion-browser-owner',
    );
    await expect(
      page.getByRole('heading', { name: 'Workspace ready' }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Delete Account', exact: true })
      .click();
    await expect(
      page.getByLabel('Type DELETE to confirm permanent loss'),
    ).toBeVisible();
    await page
      .getByLabel('Type DELETE to confirm permanent loss')
      .fill('DELETE');
    await page.screenshot({
      path: `.local/deletion-confirmation-${width}.png`,
      fullPage: true,
    });
    await page
      .getByRole('button', { name: 'Verify with Google', exact: true })
      .click();
    await expect(
      page.getByRole('button', { name: 'Request permanent deletion' }),
    ).toBeEnabled();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Workspace ready' }),
    ).toBeVisible();
    await env.withSecurityRulesDisabled(async (c) =>
      expect(
        (await getDoc(doc(c.firestore(), `accountDeletion/${uid}`))).exists(),
      ).toBe(false),
    );
    await page
      .getByRole('button', { name: 'Delete Account', exact: true })
      .click();
    await page
      .getByLabel('Type DELETE to confirm permanent loss')
      .fill('DELETE');
    await page
      .getByRole('button', { name: 'Verify with Google', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Request permanent deletion' })
      .click();
    await expect(
      page.getByText('Deletion requested — awaiting operator processing', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Workspace ready' }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Cancel', exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Logout', exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.reload();
    await expect(
      page.getByText('Deletion requested — awaiting operator processing', {
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Refresh status', exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Workspace ready' }),
    ).toHaveCount(0);
    await page.getByRole('button', { name: 'Logout', exact: true }).click();
    await expect(
      page.getByText('You are signed out.', { exact: true }),
    ).toBeVisible();
  });
