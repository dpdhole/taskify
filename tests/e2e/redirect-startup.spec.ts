// Production adapter against synthetic redirect providers; no real-provider acceptance.
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { RedirectProbe } from '../support/redirect-proof-probe';
const origin = 'http://127.0.0.1:5176';
async function initialize(page: Page) {
  await page.goto(origin);
  await page.evaluate(async () => {
    const url = '/tests/support/redirect-proof-probe.ts';
    const module: { createRedirectProbe: () => Promise<RedirectProbe> } =
      await import(url);
    window.redirectProbe = await module.createRedirectProbe();
  });
}
async function addAccount(popup: Page, email: string) {
  await expect(popup.locator('#title')).toBeVisible();
  const add = popup.getByRole('button', { name: 'Add new account' });
  if (await add.isVisible()) await add.click();
  await popup.locator('#email-input').fill(email);
  await popup.locator('#display-name-input').fill('Synthetic redirect probe');
  await popup.locator('#sign-in').click();
}
for (const provider of ['google', 'microsoft']) {
  for (const scenario of [
    'success',
    'wrong-account',
    'logout',
    'account-switch',
  ]) {
    test(
      'isolated redirect probe: ' + provider + ' ' + scenario,
      async ({ page, context }) => {
        await context.route('**/*', (route) =>
          [
            'http://127.0.0.1:5176',
            'http://127.0.0.1:9099',
            'https://apis.google.com',
          ].includes(new URL(route.request().url()).origin)
            ? route.continue()
            : route.abort(),
        );
        await page.setViewportSize({ width: 390, height: 844 });
        await initialize(page);
        const popupPromise = page.waitForEvent('popup');
        await page
          .getByRole('button', {
            name: 'Probe sign in ' + provider,
            exact: true,
          })
          .click();
        const email = provider + '-' + scenario + '@example.invalid';
        await addAccount(await popupPromise, email);
        await expect
          .poll(() => page.evaluate(() => window.redirectProbe.state().mainUid))
          .toBeTruthy();
        const original = await page.evaluate(
          () => window.redirectProbe.state().mainUid,
        );
        await page
          .getByRole('button', {
            name: 'Probe verify ' + provider,
            exact: true,
          })
          .click();
        await page.waitForURL(/127\.0\.0\.1:9099/);
        let expected = original;
        let other: Page | undefined;
        if (scenario === 'logout' || scenario === 'account-switch') {
          other = await context.newPage();
          await initialize(other);
          await other.evaluate(() => window.redirectProbe.logout());
          expected = undefined;
          if (scenario === 'account-switch') {
            const nextPopup = other.waitForEvent('popup');
            await other
              .getByRole('button', {
                name: 'Probe sign in google',
                exact: true,
              })
              .click();
            await addAccount(
              await nextPopup,
              provider + '-new-account@example.invalid',
            );
            await expect
              .poll(() =>
                other!.evaluate(() => window.redirectProbe.state().mainUid),
              )
              .toBeTruthy();
            expected = await other.evaluate(
              () => window.redirectProbe.state().mainUid,
            );
            expect(expected).not.toBe(original);
          }
        }
        if (scenario === 'wrong-account')
          await addAccount(page, provider + '-wrong@example.invalid');
        else await page.getByText(email, { exact: true }).click();
        await page.waitForURL(origin + '/');
        await initialize(page);
        const state = await page.evaluate(() => window.redirectProbe.state());
        expect(state.mainUid).toBe(expected);
        expect(state.proofUid).toBeUndefined();
        expect(state.result.accepted).toBe(scenario === 'success');
        if (scenario === 'success') expect(state.result.uid).toBe(original);
        if (scenario === 'wrong-account')
          expect(state.result.reason).toBe('wrong-account');
        if (other)
          expect(
            await other.evaluate(() => window.redirectProbe.state().mainUid),
          ).toBe(expected);
      },
    );
  }
}
