import { test, expect } from '@playwright/test';
import { toFields } from '../../tools/publish-compatibility.mjs';
import { contract } from '../support/compatibility-fixtures';
const origin = 'http://127.0.0.1:4175';
for (const width of [390, 1280])
  test(
    'compatibility transitions and draft/unknown-outcome preservation at ' +
      width,
    async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.setViewportSize({ width, height: 800 });
      await page.goto(origin + '/');
      await expect(page.getByRole('status')).toContainText(
        'Compatibility verified',
      );
      const input = page.getByRole('textbox');
      await input.fill('unsaved input');
      await page.getByRole('button', { name: 'Simulate blocked' }).click();
      await expect(page.getByRole('status')).toContainText('newer Taskify');
      await expect(
        page.getByRole('button', { name: 'Submit synthetic command' }),
      ).toBeDisabled();
      await expect(input).toHaveValue('unsaved input');
      await page.getByRole('button', { name: 'Simulate ready' }).click();
      await expect(
        page.getByRole('button', { name: 'Submit synthetic command' }),
      ).toBeEnabled();
      await page.getByRole('button', { name: 'Simulate cache' }).click();
      await expect(page.getByRole('status')).toContainText(
        'verification is unavailable',
      );
      await page
        .getByRole('button', { name: 'Retry compatibility check' })
        .click();
      await expect(page.getByRole('status')).toContainText(
        'Compatibility verified',
      );
      await input.fill('unknown');
      await page
        .getByRole('button', { name: 'Submit synthetic command' })
        .click();
      await expect(page.getByLabel('Synthetic command outcome')).toHaveText(
        'unknown',
      );
      await expect(
        page.getByRole('button', { name: 'Submit synthetic command' }),
      ).toBeDisabled();
      await page
        .getByRole('button', { name: 'Check original outcome' })
        .click();
      await expect(page.getByLabel('Synthetic command outcome')).toHaveText(
        'confirmed',
      );
      await page.evaluate(() => window.dispatchEvent(new Event('offline')));
      await expect(page.getByRole('status')).toContainText(
        'verification is unavailable',
      );
      await expect(input).toHaveValue('unknown');
      await page.evaluate(() => window.dispatchEvent(new Event('online')));
      await expect(page.getByRole('status')).toContainText(
        'Compatibility verified',
      );
      await page.getByRole('button', { name: 'Simulate missing' }).click();
      await expect(page.getByRole('status')).toContainText(
        'missing or invalid',
      );
      await page
        .getByRole('button', { name: 'Retry compatibility check' })
        .focus();
      await expect(
        page.getByRole('button', { name: 'Retry compatibility check' }),
      ).toBeFocused();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(errors).toEqual([]);
    },
  );
test('actual emulator contract changes revoke and recover the isolated harness', async ({
  page,
  request,
}) => {
  const url =
    'http://127.0.0.1:8080/v1/projects/demo-taskify-compatibility/databases/(default)/documents/runtime/compatibility';
  const seed = async (value: unknown) => {
    const r = await request.patch(url, {
      headers: { Authorization: 'Bearer owner' },
      data: { fields: toFields(value) },
    });
    expect(r.ok()).toBe(true);
  };
  await seed(contract({ revision: 10 }));
  await page.goto(origin + '/?source=emulator');
  await expect(page.getByRole('status')).toContainText(
    'Compatibility verified',
  );
  await seed(
    contract({ revision: 11, minAppVersion: '0.2.0', maxAppVersion: '0.2.0' }),
  );
  await expect(page.getByRole('status')).toContainText('newer Taskify');
  await seed(contract({ revision: 12 }));
  await expect(page.getByRole('status')).toContainText(
    'Compatibility verified',
  );
  await expect(page.getByRole('status')).not.toContainText('unavailable');
  await page.reload();
  await expect(page.getByRole('status')).toContainText(
    'Compatibility verified',
  );
});
test('ordinary build is fail-closed when unconfigured and excludes synthetic controls', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:4174/');
  await expect(page.getByRole('status')).toContainText('missing or invalid');
  await expect(
    page.getByRole('button', { name: 'Retry compatibility check' }),
  ).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Compatibility test harness' }),
  ).toHaveCount(0);
});
