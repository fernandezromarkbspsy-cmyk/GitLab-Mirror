const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: __dirname,
  testMatch: "realtime.spec.js",
  timeout: 60_000,
  use: {
    browserName: "chromium",
    headless: true,
  },
});
