const { defineConfig } = require("@playwright/test");

<<<<<<< HEAD
=======
if (!process.env.PRODUCTION_PLAYWRIGHT_AUTH_STATE) {
  throw new Error(
    "PRODUCTION_PLAYWRIGHT_AUTH_STATE must point to an approved, local production test storage state.",
  );
}

>>>>>>> c236f8f480a319b1f6ad5dfba8e98324d31e5852
module.exports = defineConfig({
  testDir: __dirname,
  testMatch: "realtime.spec.js",
  timeout: 60_000,
  use: {
<<<<<<< HEAD
    browserName: "chromium",
    headless: true,
=======
    baseURL: process.env.PRODUCTION_PLAYWRIGHT_BASE_URL ?? "https://soc5outboundops.app",
    browserName: "chromium",
    headless: true,
    storageState: process.env.PRODUCTION_PLAYWRIGHT_AUTH_STATE,
>>>>>>> c236f8f480a319b1f6ad5dfba8e98324d31e5852
  },
});
