import { expect, test } from '@playwright/test';

const zoomLevels = [80, 90, 100, 110, 125, 150];
const referenceWidth = 1366;

test('reflows the application shell at common browser zoom levels', async ({
  page,
}) => {
  await page.goto('/?builderPreview=1#/dashboard');
  await page.waitForSelector('main[aria-label="Primary content"]');

  for (const zoomLevel of zoomLevels) {
    const viewportWidth = Math.round(referenceWidth / (zoomLevel / 100));
    await page.setViewportSize({ width: viewportWidth, height: 900 });

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
  await page.goto('/?builderPreview=1#/dashboard');

  const menuToggle = page.getByRole('button', { name: 'Open navigation' });
  const navigation = page.locator('#primary-navigation');
  const scrim = page.getByRole('button', { name: 'Close navigation' });

  await expect(menuToggle).toBeVisible();
  await expect(menuToggle).toHaveAttribute('aria-expanded', 'false');

  await menuToggle.click();
  await expect(menuToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(scrim).toBeVisible();

  // The unauthenticated builder preview keeps its login layer above the shell;
  // force the shell scrim click so this test isolates the navigation behavior.
  await scrim.evaluate((element) => (element as HTMLButtonElement).click());
  await expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(menuToggle).toBeFocused();

  await menuToggle.click();
  await navigation
    .getByRole('button', { name: 'Dashboard' })
    .evaluate((element) => (element as HTMLButtonElement).click());
  await expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(menuToggle).toBeFocused();
});
