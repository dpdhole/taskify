import { test, expect } from '@playwright/test';
for (const width of [390, 959, 960, 1280]) {
  test(`navigation layout and history at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Home', exact: true }),
    ).toBeVisible();
    const main = page.getByRole('main');
    const before = await main.boundingBox();
    await page.getByRole('button', { name: 'Open navigation' }).click();
    const navigation = page.getByRole('navigation');
    const after = await main.boundingBox();
    if (width < 960) {
      await expect(page.getByRole('dialog')).toBeVisible();
      expect(after?.x).toBe(before?.x);
      await expect(
        page.getByRole('button', { name: 'Close navigation' }),
      ).toBeFocused();
    } else expect(after!.x).toBeGreaterThan(before!.x);
    await navigation.getByRole('link', { name: 'Focus', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Focus', exact: true }),
    ).toBeFocused();
    if (width < 960) await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Focus', exact: true }),
    ).toBeVisible();
    if (width < 960)
      await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await navigation.getByRole('link', { name: 'My Account' }).click();
    const profile = page.getByRole('region', { name: 'Account information' });
    await expect(
      profile.getByText('Local preview account', { exact: true }),
    ).toBeVisible();
    await expect(profile.getByText('preview@example.test')).toBeVisible();
    await expect(profile.locator('img')).toHaveAttribute(
      'src',
      '/icons/material-symbols-rounded/person.svg',
    );
    await expect(
      page
        .getByRole('main')
        .getByRole('button', { name: 'Logout', exact: true }),
    ).toBeVisible();
    await expect(
      page
        .getByRole('banner')
        .getByRole('button', { name: 'Logout', exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole('button', { name: 'Delete Account', exact: true })
      .click();
    await expect(
      page.getByText(
        /Account verification and deletion require a signed-in workspace/,
      ),
    ).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: /Verify with|Request permanent deletion/,
      }),
    ).toHaveCount(0);
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Focus', exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/navigation-${width}.png`,
      fullPage: true,
    });
  });
}
test('mobile Escape/backdrop and resizing release background locks', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.keyboard.press('Shift+Tab');
  await expect(
    page.getByRole('button', { name: 'Settings', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Open navigation' }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.mouse.click(380, 300);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.setViewportSize({ width: 960, height: 700 });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  expect(
    await page.getByRole('main').evaluate((el) => el.closest('[inert]')),
  ).toBeNull();
});

test('hover previews overlay without pushing content and retain keyboard focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const main = page.getByRole('main');
  const before = await main.boundingBox();
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Home', exact: true })
    .hover();
  await expect(
    page.getByRole('button', { name: 'Close navigation' }),
  ).toBeVisible();
  expect((await main.boundingBox())?.x).toBe(before?.x);
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Focus', exact: true })
    .focus();
  await page.mouse.move(900, 100);
  await expect(
    page.getByRole('button', { name: 'Close navigation' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Close navigation' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Open navigation' }),
  ).toBeFocused();
});

test('storage denial keeps explicit expansion usable and a deep link has a safe fallback', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', {
      get() {
        throw new Error('storage denied');
      },
    });
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/settings/account');
  await expect(
    page.getByRole('heading', { name: 'My Account', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Back', exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole('banner')
    .getByRole('link', { name: 'Home', exact: true })
    .click();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(
    page.getByRole('button', { name: 'Collapse navigation' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close navigation' }).click();
  await expect(
    page.getByRole('button', { name: 'Open navigation' }),
  ).toBeVisible();
});
