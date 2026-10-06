<<<<<<< HEAD
import { mockShellSession } from "./helpers/shell-session";
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await mockShellSession(page);
});

=======
import { expect, test } from '@playwright/test';

>>>>>>> c236f8f480a319b1f6ad5dfba8e98324d31e5852
const zoomLevels = [80, 90, 100, 110, 125, 150];
const referenceWidth = 1366;

test('reflows the application shell at common browser zoom levels', async ({
  page,
}) => {
<<<<<<< HEAD
  await page.goto('/dashboard');
=======
  await page.goto('/?builderPreview=1#/dashboard');
>>>>>>> c236f8f480a319b1f6ad5dfba8e98324d31e5852
  await page.waitForSelector('main[aria-label="Primary content"]');

  for (const zoomLevel of zoomLevels) {
    const viewportWidth = Math.round(referenceWidth / (zoomLevel / 100));
    await page.setViewportSize({ width: viewportWidth, height: 900 });
<<<<<<< HEAD
    await page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
=======
>>>>>>> c236f8f480a319b1f6ad5dfba8e98324d31e5852

    const layout = await page.evaluate(() => {
      const sidebar = document.querySelector('aside');
      const content = document.querySelector('main[aria-label="Primary content"]');
      const header = document.querySelector('header');

      if (
        !(sidebar instanceof HTMLElement) ||
        !(content instanceof HTMLElement) ||
        !(header instanceof HTMLElement)
      ) {
        throw new Error('Responsive shell fixture is missing a shell element');
      }

      const contentBounds = content.getBoundingClientRect();
      const headerBounds = header.getBoundingClientRect();
      const sidebarBounds = sidebar.getBoundingClientRect();

      return {
        sidebarTransform: getComputedStyle(sidebar).transform,
        sidebarRight: sidebarBounds.right,
        contentLeft: contentBounds.left,
        contentRight: contentBounds.right,
        contentWidth: contentBounds.width,
        headerLeft: headerBounds.left,
        headerRight: headerBounds.right,
        viewportWidth: document.documentElement.clientWidth,
        documentWidth: document.documentElement.scrollWidth,
      };
    });

    const shellOffsets = [0, layout.sidebarRight];
    expect(Math.min(...shellOffsets.map((offset) => Math.abs(layout.contentLeft - offset)))).toBeLessThan(1);
    expect(Math.min(...shellOffsets.map((offset) => Math.abs(layout.headerLeft - offset)))).toBeLessThan(1);
    expect(layout.headerRight).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.contentRight).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.contentWidth).toBeGreaterThan(0);
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
  }
});

test('opens and closes mobile navigation without trapping focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 900 });
<<<<<<< HEAD
  await page.goto('/dashboard');

  const menuToggle = page.getByRole('button', { name: 'Open navigation' });
  const navigation = page.locator('#primary-navigation');
=======
  await page.goto('/?builderPreview=1#/dashboard');

  const menuToggle = page.getByRole('button', { name: 'Open navigation' });
  const navigation = page.locator('#primary-navigation');
  const sidebar = page.locator('aside');
>>>>>>> c236f8f480a319b1f6ad5dfba8e98324d31e5852
  const scrim = page.getByRole('button', { name: 'Close navigation' });

  await expect(menuToggle).toBeVisible();
  await expect(menuToggle).toHaveAttribute('aria-expanded', 'false');

  await menuToggle.click();
  await expect(menuToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(scrim).toBeVisible();
<<<<<<< HEAD

  await scrim.click();
=======
  await expect(
    sidebar.evaluate((element) =>
      element.classList.contains('max-[960px]:translate-x-0!'),
    ),
  ).resolves.toBe(true);
  await expect(sidebar).toHaveCSS('transform', 'none');

  // The unauthenticated builder preview keeps its login layer above the shell;
  // force the shell scrim click so this test isolates the navigation behavior.
  await scrim.evaluate((element) => (element as HTMLButtonElement).click());
>>>>>>> c236f8f480a319b1f6ad5dfba8e98324d31e5852
  await expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(menuToggle).toBeFocused();

  await menuToggle.click();
  await navigation
    .getByRole('button', { name: 'Dashboard' })
    .evaluate((element) => (element as HTMLButtonElement).click());
  await expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(menuToggle).toBeFocused();
});
