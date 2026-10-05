import { mockShellSession } from "./helpers/shell-session";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await mockShellSession(page);
});

test("keeps the scorecards in the original desktop composition at 80% zoom", async ({ page }) => {
  await page.setViewportSize({ width: 2400, height: 1200 });
  await page.goto("/dashboard");
  await page.waitForSelector(".scorecards-layout");

  const layout = await page.evaluate(() => {
    const scorecards = document.querySelector(".scorecards-layout");
    const metrics = document.querySelector(".overview-metrics");
    const intraday = document.querySelector(".intraday-shell");

    if (!(scorecards instanceof HTMLElement) || !(metrics instanceof HTMLElement) || !(intraday instanceof HTMLElement)) {
      throw new Error("Scorecards fixture is missing");
    }

    const scorecardBounds = scorecards.getBoundingClientRect();
    const metricsBounds = metrics.getBoundingClientRect();
    const intradayBounds = intraday.getBoundingClientRect();
    const columns = getComputedStyle(scorecards).gridTemplateColumns.split(" ");
    const metricColumns = getComputedStyle(metrics).gridTemplateColumns.split(" ");

    return {
      scorecardWidth: scorecardBounds.width,
      metricsWidth: metricsBounds.width,
      intradayWidth: intradayBounds.width,
      sameRow: Math.abs(metricsBounds.top - intradayBounds.top) < 1,
      columns: columns.length,
      metricColumns: metricColumns.length,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    };
  });

  expect(layout.columns).toBe(2);
  expect(layout.metricColumns).toBe(2);
  expect(layout.sameRow).toBe(true);
  expect(layout.intradayWidth / layout.scorecardWidth).toBeGreaterThan(0.55);
  expect(layout.intradayWidth / layout.scorecardWidth).toBeLessThan(0.65);
  expect(layout.metricsWidth / layout.scorecardWidth).toBeGreaterThan(0.35);
  expect(layout.metricsWidth / layout.scorecardWidth).toBeLessThan(0.45);
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
});
