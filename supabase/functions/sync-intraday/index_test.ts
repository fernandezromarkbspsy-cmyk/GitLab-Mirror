import { assertEquals } from "jsr:@std/assert@1.0.8";
import { handleRequest } from "./index.ts";

const headers = {
  "content-type": "application/json",
  "x-sync-source": "google-apps-script",
  "x-sync-secret": "test-secret",
};

Deno.test("rejects a missing shared secret configuration", async () => {
  Deno.env.delete("INTRADAY_SYNC_SECRET");
  const response = await handleRequest(new Request("http://localhost", {
    method: "POST",
    headers,
    body: "[]",
  }));

  assertEquals(response.status, 500);
});

Deno.test("reports invalid intraday rows without exposing provider errors", async () => {
  Deno.env.set("INTRADAY_SYNC_SECRET", "test-secret");
  const response = await handleRequest(new Request("http://localhost", {
    method: "POST",
    headers,
    body: JSON.stringify([{ dispatch_date: "not-a-date", hour: 25, order_qty: -1 }]),
  }));

  assertEquals(response.status, 422);
  assertEquals(await response.json(), {
    error: "No valid intraday rows supplied.",
    received: 1,
    rejected: 1,
  });
});

Deno.test("rejects oversized request bodies", async () => {
  Deno.env.set("INTRADAY_SYNC_SECRET", "test-secret");
  const response = await handleRequest(new Request("http://localhost", {
    method: "POST",
    headers,
    body: JSON.stringify({ data: "x".repeat(1_000_001) }),
  }));

  assertEquals(response.status, 413);
});
