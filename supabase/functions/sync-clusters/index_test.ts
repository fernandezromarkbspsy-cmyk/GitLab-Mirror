import { assertEquals } from "jsr:@std/assert@1.0.8";
import { handleRequest } from "./index.ts";

const headers = {
  "content-type": "application/json",
  "x-sync-source": "google-apps-script",
  "x-sync-secret": "test-secret",
};

Deno.test("rejects invalid cluster rows with a stable validation response", async () => {
  Deno.env.set("CLUSTER_SYNC_SECRET", "test-secret");
  const response = await handleRequest(new Request("http://localhost", {
    method: "POST",
    headers,
    body: JSON.stringify([{ cluster_name: "", region: "" }]),
  }));

  assertEquals(response.status, 422);
  assertEquals(await response.json(), {
    error: "No valid cluster rows supplied.",
    received: 1,
    rejected: 1,
  });
});

Deno.test("rejects a missing shared secret configuration", async () => {
  Deno.env.delete("CLUSTER_SYNC_SECRET");
  const response = await handleRequest(new Request("http://localhost", {
    method: "POST",
    headers,
    body: "[]",
  }));

  assertEquals(response.status, 500);
});

Deno.test("rejects oversized request bodies", async () => {
  Deno.env.set("CLUSTER_SYNC_SECRET", "test-secret");
  const response = await handleRequest(new Request("http://localhost", {
    method: "POST",
    headers,
    body: JSON.stringify({ cluster_name: "x".repeat(1_000_001) }),
  }));

  assertEquals(response.status, 413);
});
