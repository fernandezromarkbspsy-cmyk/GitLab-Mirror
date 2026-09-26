import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/requests**', async (route) => {
    await route.fulfill({
      json: {
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 20,
        from: null,
        to: null,
        total: 0,
      },
    });
  });
});

test('renders the unauthenticated login entry', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/SOC 5 Outbound/);
  await expect(page.getByText('Login as')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('tab', { name: 'FTE' })).toBeVisible();
});

test('preserves deep links while showing the login entry', async ({ page }) => {
  await page.goto('/outbound/lh-request');

  await expect(page.getByText('Login as')).toBeVisible({ timeout: 10_000 });
  await expect(page).toHaveTitle(/SOC 5 Outbound/);
  expect(new URL(page.url()).pathname).toBe('/outbound/lh-request');
});
