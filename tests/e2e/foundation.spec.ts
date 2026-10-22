import { test, expect } from '@playwright/test';
for (const width of [390, 1280])
  test('memory proof and navigation at ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Taskify Foundation' }),
    ).toBeVisible();
    await expect(page.getByRole('status')).toContainText('revision 0');
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('button', { name: 'Retry connection' }),
    ).toBeFocused();
    await page.getByRole('button', { name: 'Update synthetic value' }).click();
    await expect(page.getByRole('status')).toContainText('revision 1');
    await page.getByRole('link', { name: 'Inspect navigation' }).click();
    await expect(page).toHaveURL(/\/inspect$/);
    await page.reload();
    await expect(page.getByRole('status')).toContainText(
      'Memory connection verified',
    );
    await page.goBack();
    await expect(
      page.getByRole('heading', { name: 'Taskify Foundation' }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
test('reads local Firebase through the same UI and recovers from malformed fixture data', async ({
  page,
  request,
}) => {
  const url =
    'http://127.0.0.1:8080/v1/projects/demo-taskify-foundation/databases/(default)/documents/foundationProbe/status';
  const seed = async (message: unknown) => {
    const fields = {
      message:
        typeof message === 'string'
          ? { stringValue: message }
          : { integerValue: '7' },
      revision: { integerValue: '1' },
    };
    const response = await request.patch(url, {
      headers: { Authorization: 'Bearer owner' },
      data: { fields },
    });
    expect(response.ok()).toBe(true);
  };
  try {
    await seed('Emulator connection verified');
    await page.goto('/?source=emulator');
    await expect(page.getByRole('status')).toContainText(
      'Emulator connection verified',
    );
    await seed(7);
    await expect(page.getByRole('alert')).toContainText(
      'Connection unavailable',
    );
    await seed('Emulator connection verified');
    await page.getByRole('button', { name: 'Retry connection' }).click();
    await expect(page.getByRole('status')).toContainText(
      'Emulator connection verified',
    );
    await expect(
      page.getByRole('button', { name: 'Update synthetic value' }),
    ).toHaveCount(0);
  } finally {
    await seed('Emulator connection verified');
  }
});

test('ordinary dev and static entries exclude proof access and render correctly', async ({
  page,
  request,
}) => {
  for (const origin of ['http://127.0.0.1:4174', 'http://127.0.0.1:5173']) {
    await page.goto(origin + '/');
    await expect(
      page.getByRole('heading', { name: 'Taskify', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Taskify Foundation', exact: true }),
    ).toHaveCount(0);
    await expect(page.locator('main')).toHaveCSS(
      'background-color',
      'rgb(255, 255, 255)',
    );
  }
  for (const route of [
    '/foundation.html',
    '/src/app/proof.tsx',
    '/src/ui/ProofView.tsx',
  ])
    expect(
      (
        await request.get('http://127.0.0.1:5173' + route, { timeout: 5000 })
      ).status(),
    ).toBe(404);
});
