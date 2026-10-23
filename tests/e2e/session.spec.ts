import fs from 'node:fs';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { SessionFixture } from '../support/session-browser-fixture';
const origin = 'http://127.0.0.1:5176';
async function initialize(page: Page) {
  await page.goto(origin);
  await page.evaluate(async () => {
    const url = '/tests/support/session-browser-fixture.ts';
    const fixture: { createSessionFixture: () => SessionFixture } =
      await import(url);
    window.sessionFixture = fixture.createSessionFixture();
  });
  await expect
    .poll(() => page.evaluate(() => window.sessionFixture.state().status))
    .not.toBe('restoring');
}
for (const width of [390, 1280])
  test(
    'SDK session persists across refresh and supports gated Logout at ' +
      width +
      'px',
    async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      const origins = new Set<string>();
      page.on('request', (r) => origins.add(new URL(r.url()).origin));
      await initialize(page);
      await expect
        .poll(() => page.evaluate(() => window.sessionFixture.state().status))
        .toBe('signed-out');
      await page.evaluate(() => window.sessionFixture.signIn('fixture-first'));
      await expect
        .poll(() =>
          page.evaluate(() => window.sessionFixture.state().protectedReady),
        )
        .toBe(true);
      const uid = await page.evaluate(
        () => window.sessionFixture.state().identity?.uid,
      );
      await page.reload();
      await initialize(page);
      await expect
        .poll(() =>
          page.evaluate(() => window.sessionFixture.state().identity?.uid),
        )
        .toBe(uid);
      await expect(
        page.getByRole('region', { name: 'Authenticated account' }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      ).toBe(false);
      await page.evaluate(() => window.sessionFixture.offline());
      expect(
        await page.evaluate(() => window.sessionFixture.state().protectedReady),
      ).toBe(false);
      expect(
        await page.evaluate(() => window.sessionFixture.state().canLogout),
      ).toBe(true);
      await expect(
        page.getByRole('region', { name: 'Authenticated account' }),
      ).toHaveCount(0);
      await page.getByRole('button', { name: 'Logout', exact: true }).click();
      await expect
        .poll(() => page.evaluate(() => window.sessionFixture.state().status))
        .toBe('signed-out');
      await page.reload();
      await initialize(page);
      await expect
        .poll(() => page.evaluate(() => window.sessionFixture.state().status))
        .toBe('signed-out');
      expect(
        [...origins].every(
          (o) => o === origin || o === 'http://127.0.0.1:9099',
        ),
      ).toBe(true);
      await page.evaluate(() => window.sessionFixture.dispose());
    },
  );
test('SDK propagates identity changes and Logout across tabs without mixing account state', async ({
  context,
  page,
}) => {
  await initialize(page);
  await page.evaluate(() => window.sessionFixture.signIn('fixture-first'));
  await expect
    .poll(() =>
      page.evaluate(() => window.sessionFixture.state().protectedReady),
    )
    .toBe(true);
  const first = await page.evaluate(
    () => window.sessionFixture.state().identity?.uid,
  );
  const other = await context.newPage();
  await initialize(other);
  await expect
    .poll(() =>
      other.evaluate(() => window.sessionFixture.state().identity?.uid),
    )
    .toBe(first);
  await other.evaluate(() => window.sessionFixture.signIn('fixture-second'));
  await expect
    .poll(() =>
      page.evaluate(() => window.sessionFixture.state().identity?.uid),
    )
    .not.toBe(first);
  expect(
    await page.evaluate(() => window.sessionFixture.state().identity?.uid),
  ).toBe(
    await other.evaluate(() => window.sessionFixture.state().identity?.uid),
  );
  await other.getByRole('button', { name: 'Logout', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.sessionFixture.state().status))
    .toBe('signed-out');
  expect(
    await page.evaluate(() => window.sessionFixture.state().identity),
  ).toBeNull();
  await page.evaluate(() => window.sessionFixture.dispose());
  await other.evaluate(() => window.sessionFixture.dispose());
});

async function completeProviderEmulator(
  page: Page,
  email: string,
  provider: string,
) {
  await expect(page.locator('#title')).toBeVisible();
  const add = page.getByRole('button', { name: 'Add new account' });
  if (await add.isVisible()) await add.click();
  await page
    .locator('#email-input')
    .fill(email.replace('@', '-' + provider.toLowerCase() + '@'));
  await page.locator('#display-name-input').fill(provider + ' emulator user');
  await page.locator('#sign-in').click();
}
for (const provider of ['Google', 'Microsoft']) {
  test(
    provider + ' button completes an emulator popup and persists the session',
    async ({ context, page }) => {
      // Firebase's resolver loads the official Google iframe library even in emulator mode.
      // Only that helper origin and the owned local services are allowed.
      await context.route('**/*', (route) => {
        const url = new URL(route.request().url());
        return [
          'http://127.0.0.1:5176',
          'http://127.0.0.1:9099',
          'https://apis.google.com',
        ].includes(url.origin)
          ? route.continue()
          : route.abort();
      });
      await initialize(page);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      ).toBe(false);
      const popupEvent = page.waitForEvent('popup');
      await page
        .getByRole('button', { name: 'Continue with ' + provider })
        .click();
      const popup = await popupEvent;
      await expect(page.getByRole('status')).toContainText(
        provider + ' sign-in',
      );
      await expect(popup).toHaveURL(/127\.0\.0\.1:9099/);
      await completeProviderEmulator(
        popup,
        'popup-user@example.invalid',
        provider,
      );
      await expect(
        page.getByRole('region', { name: 'Authenticated account' }),
      ).toBeVisible();
      await page.reload();
      await initialize(page);
      await expect(
        page.getByRole('region', { name: 'Authenticated account' }),
      ).toBeVisible();
    },
  );
  test(
    'cancelling a pending ' + provider + ' popup rejects its late result',
    async ({ context, page }) => {
      await context.route('**/*', (route) => {
        const url = new URL(route.request().url());
        return [
          'http://127.0.0.1:5176',
          'http://127.0.0.1:9099',
          'https://apis.google.com',
        ].includes(url.origin)
          ? route.continue()
          : route.abort();
      });
      await initialize(page);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      ).toBe(false);
      const popupEvent = page.waitForEvent('popup');
      await page
        .getByRole('button', { name: 'Continue with ' + provider })
        .click();
      const popup = await popupEvent;
      await expect(page.getByRole('status')).toContainText(
        provider + ' sign-in',
      );
      await expect(popup.locator('#title')).toBeVisible();
      await page.getByRole('button', { name: 'Cancel sign-in' }).click();
      await expect(page.getByRole('status')).toContainText('signed out');
      await completeProviderEmulator(
        popup,
        'late-popup@example.invalid',
        provider,
      );
      await expect(
        page.getByRole('button', { name: 'Continue with ' + provider }),
      ).toBeEnabled();
      await expect(
        page.getByRole('region', { name: 'Authenticated account' }),
      ).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: 'Continue with ' + provider }),
      ).toBeFocused();
      await page.reload();
      await initialize(page);
      await expect(page.getByRole('status')).toContainText('signed out');
    },
  );
  test(
    'blocked ' +
      provider +
      ' popup offers explicit redirect and restores the emulator return',
    async ({ context, page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await context.route('**/*', (route) => {
        const url = new URL(route.request().url());
        return [
          'http://127.0.0.1:5176',
          'http://127.0.0.1:9099',
          'https://apis.google.com',
        ].includes(url.origin)
          ? route.continue()
          : route.abort();
      });
      await page.addInitScript(() => {
        window.open = () => null;
      });
      await initialize(page);
      await page
        .getByRole('button', { name: 'Continue with ' + provider })
        .click();
      await expect(page.getByRole('alert')).toContainText('blocked');
      await page
        .getByRole('button', { name: 'Continue with redirect' })
        .click();
      await expect(page).toHaveURL(/127\.0\.0\.1:9099/);
      await completeProviderEmulator(
        page,
        'redirect-user@example.invalid',
        provider,
      );
      await page.waitForURL(origin + '/');
      await initialize(page);
      await expect(
        page.getByRole('region', { name: 'Authenticated account' }),
      ).toBeVisible();
    },
  );

  test(
    'Logout in another tab invalidates an unfinished ' + provider + ' popup',
    async ({ context, page }) => {
      await context.route('**/*', (route) => {
        const url = new URL(route.request().url());
        return [
          'http://127.0.0.1:5176',
          'http://127.0.0.1:9099',
          'https://apis.google.com',
        ].includes(url.origin)
          ? route.continue()
          : route.abort();
      });
      await initialize(page);
      const other = await context.newPage();
      await initialize(other);
      const popupEvent = page.waitForEvent('popup');
      await page
        .getByRole('button', { name: 'Continue with ' + provider })
        .click();
      const popup = await popupEvent;
      await expect(page.getByRole('status')).toContainText(
        provider + ' sign-in',
      );
      await expect(popup.locator('#title')).toBeVisible();
      await other.evaluate(() =>
        window.sessionFixture.signIn('other-tab-account'),
      );
      await expect(
        other.getByRole('button', { name: 'Logout', exact: true }),
      ).toBeVisible();
      await other.getByRole('button', { name: 'Logout', exact: true }).click();
      await expect(other.getByRole('status')).toContainText('signed out');
      await completeProviderEmulator(
        popup,
        'cross-tab-late@example.invalid',
        provider,
      );
      await expect(
        page.getByRole('button', { name: 'Continue with ' + provider }),
      ).toBeEnabled();
      await expect(page.getByRole('status')).toContainText('signed out');
      await page.reload();
      await initialize(page);
      await expect(
        page.getByRole('region', { name: 'Authenticated account' }),
      ).toHaveCount(0);
    },
  );
}

for (const width of [320, 390, 768, 1280]) {
  test(
    'centered login presentation and keyboard access at ' + width + 'px',
    async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await initialize(page);
      const google = page.getByRole('button', { name: 'Continue with Google' });
      const microsoft = page.getByRole('button', {
        name: 'Continue with Microsoft',
      });
      await expect(google).toBeEnabled();
      await expect(microsoft).toBeEnabled();
      await expect(
        page.getByRole('heading', { name: 'Taskify', level: 1 }),
      ).toBeVisible();
      await expect(
        page.getByRole('region', { name: 'Welcome to Taskify' }),
      ).toBeVisible();
      const first = (await google.boundingBox())!;
      const second = (await microsoft.boundingBox())!;
      expect(Math.abs(first.x + first.width / 2 - width / 2)).toBeLessThan(2);
      expect(Math.abs(first.x - second.x)).toBeLessThan(1);
      expect(second.y).toBeGreaterThan(first.y + first.height);
      expect(first.height).toBeGreaterThanOrEqual(44);
      expect(second.height).toBeGreaterThanOrEqual(44);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      ).toBe(false);
      await expect(
        page.getByText(/emulator-session-fixture/),
      ).not.toBeVisible();
      await page.keyboard.press('Tab');
      await expect(google).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(microsoft).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(page.getByText('Technical details')).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.getByText(/emulator-session-fixture/)).toBeVisible();
      await page.keyboard.press('Enter');
      if (width === 390 || width === 1280) {
        fs.mkdirSync('.local/slice3-login-presentation', { recursive: true });
        await page.screenshot({
          path: '.local/slice3-login-presentation/' + width + '.png',
          fullPage: true,
        });
      }
    },
  );
}
