import { expect, test as setup } from '@playwright/test';

const authFile = 'playwright/.auth/backroom.json';

setup('authenticate the isolated Backroom test user', async ({ page }) => {
  const opsId = process.env.E2E_BACKROOM_OPS_ID;
  const password = process.env.E2E_BACKROOM_PASSWORD;

  if (!opsId || !password) {
    throw new Error(
      'E2E_BACKROOM_OPS_ID and E2E_BACKROOM_PASSWORD are required for authenticated E2E setup.',
    );
  }

  await page.goto('/');
  await page.getByRole('tab', { name: 'Backroom' }).click();
  await page.getByLabel('Ops ID').fill(opsId);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();

  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
  await expect(
    page.getByRole('main', { name: 'Primary content' }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();

  await page.context().storageState({ path: authFile });
});
