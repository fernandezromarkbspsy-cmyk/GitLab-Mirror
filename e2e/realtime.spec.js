// C:\Users\phlspxuser\Documents\development\e2e\realtime.spec.js
const { test, expect } = require("@playwright/test");
<<<<<<< HEAD

test.use({
  storageState: "playwright-auth.json",
=======
const path = require("path");

const productionAuthState = process.env.PRODUCTION_PLAYWRIGHT_AUTH_STATE;

test.skip(
  !productionAuthState,
  "Set PRODUCTION_PLAYWRIGHT_AUTH_STATE to run the production realtime smoke test.",
);

test.use({
  storageState: productionAuthState
    ? path.resolve(productionAuthState)
    : undefined,
>>>>>>> c236f8f480a319b1f6ad5dfba8e98324d31e5852
});

test("production Supabase realtime connection is active", async ({ page }) => {
  test.setTimeout(130000);

  const websocketUrls = [];

  page.on("websocket", (ws) => {
    websocketUrls.push(ws.url());
    console.log("WS:", ws.url());

    ws.on("framereceived", (event) => {
      console.log("WS FRAME RECEIVED:", event.payload);
    });
  });

<<<<<<< HEAD
  await page.goto("https://soc5outboundops.app");
=======
  await page.goto(process.env.PRODUCTION_PLAYWRIGHT_BASE_URL ?? "https://soc5outboundops.app");
>>>>>>> c236f8f480a319b1f6ad5dfba8e98324d31e5852

  await page.waitForTimeout(120000);

  expect(
    websocketUrls.some((url) =>
      url.includes("/realtime/v1/websocket"),
    ),
  ).toBeTruthy();
<<<<<<< HEAD
});
=======
});
>>>>>>> c236f8f480a319b1f6ad5dfba8e98324d31e5852
