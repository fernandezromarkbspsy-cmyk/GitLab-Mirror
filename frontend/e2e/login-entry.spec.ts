import { expect, test } from '@playwright/test';

const loginEntryTimeout = 15_000;

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
  await expect(
    page.getByRole('main', { name: 'Primary content' }),
  ).toBeVisible({ timeout: 10_000 });
  await expect(
    page.getByRole('button', { name: 'Dashboard', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Primary navigation' }),
  ).toBeVisible();
  await expect(page.getByText('Login as')).toBeVisible({
    timeout: loginEntryTimeout,
  });
  await expect(page.getByRole('tab', { name: 'FTE' })).toBeVisible();
});

test('renders both supported login modes', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('tablist', { name: 'Login as' })).toBeVisible({
    timeout: loginEntryTimeout,
  });
  await expect(page.getByRole('tab', { name: 'FTE' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.getByRole('tab', { name: 'Backroom' }).click();
  await expect(page.getByLabel('Ops ID')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
});

test('preserves deep links while showing the login entry', async ({ page }) => {
  await page.goto('/outbound/lh-request');

  await expect(page.getByText('Login as')).toBeVisible({
    timeout: loginEntryTimeout,
  });
  await expect(page).toHaveTitle(/SOC 5 Outbound/);
  expect(new URL(page.url()).pathname).toBe('/outbound/lh-request');
});

test('normalizes an unknown route to the dashboard entry flow', async ({ page }) => {
  await page.goto('/not-a-real-route');

  await expect(page.getByText('Login as')).toBeVisible({
    timeout: loginEntryTimeout,
  });
  await expect(page.getByRole('tab', { name: 'FTE' })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/dashboard');
});
