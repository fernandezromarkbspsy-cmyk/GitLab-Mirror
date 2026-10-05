const { defineConfig } = require("@playwright/test");

if (!process.env.PRODUCTION_PLAYWRIGHT_AUTH_STATE) {
  throw new Error(
    "PRODUCTION_PLAYWRIGHT_AUTH_STATE must point to an approved, local production test storage state.",
  );
}

module.exports = defineConfig({
  testDir: __dirname,
  testMatch: "realtime.spec.js",
  timeout: 60_000,
  use: {
    baseURL: process.env.PRODUCTION_PLAYWRIGHT_BASE_URL ?? "https://soc5outboundops.app",
    browserName: "chromium",
    headless: true,
    storageState: process.env.PRODUCTION_PLAYWRIGHT_AUTH_STATE,
  },
});
