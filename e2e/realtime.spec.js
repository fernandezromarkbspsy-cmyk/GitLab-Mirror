// C:\Users\phlspxuser\Documents\development\e2e\realtime.spec.js
const { test, expect } = require("@playwright/test");
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

  await page.goto(process.env.PRODUCTION_PLAYWRIGHT_BASE_URL ?? "https://soc5outboundops.app");

  await page.waitForTimeout(120000);

  expect(
    websocketUrls.some((url) =>
      url.includes("/realtime/v1/websocket"),
    ),
  ).toBeTruthy();
});
