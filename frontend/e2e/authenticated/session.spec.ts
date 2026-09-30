import { expect, test } from '@playwright/test';

test('renders the protected shell and returns to login after sign out', async ({
  page,
}) => {
  await page.goto('/dashboard');

  await expect(
    page.getByRole('main', { name: 'Primary content' }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();

  await page.getByRole('button', { name: 'Sign out' }).click();

  await expect(page.getByRole('tablist', { name: 'Login as' })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole('tab', { name: 'FTE' })).toBeVisible();
});
