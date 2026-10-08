import { assertEquals } from "jsr:@std/assert@1.0.8";
import { handleRequest } from "./index.ts";

const baseHeaders = {
  "content-type": "application/json",
  "x-sync-source": "google-apps-script",
};

async function signedHeaders(body: string, timestamp = Math.floor(Date.now() / 1000)): Promise<HeadersInit> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode("test-secret"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${body}`),
  );
  const signature = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");

  return {
    ...baseHeaders,
    "x-sync-timestamp": String(timestamp),
    "x-sync-signature": signature,
  };
}

Deno.test("rejects invalid cluster rows with a stable validation response", async () => {
  Deno.env.set("SYNC_SECRET", "test-secret");
  const body = JSON.stringify([{ cluster_name: "", region: "" }]);
  const response = await handleRequest(new Request("http://localhost", {
    method: "POST",
    headers: await signedHeaders(body),
    body,
  }));

  assertEquals(response.status, 422);
  assertEquals(await response.json(), {
    error: "No valid cluster rows supplied.",
    received: 1,
    rejected: 1,
  });
});

Deno.test("rejects a missing shared secret configuration", async () => {
  Deno.env.delete("SYNC_SECRET");
  const body = "[]";
  const response = await handleRequest(new Request("http://localhost", {
    method: "POST",
    headers: baseHeaders,
    body,
  }));

  assertEquals(response.status, 500);
});

Deno.test("rejects oversized request bodies", async () => {
  Deno.env.set("SYNC_SECRET", "test-secret");
  const body = JSON.stringify({ cluster_name: "x".repeat(1_000_001) });
  const response = await handleRequest(new Request("http://localhost", {
    method: "POST",
    headers: await signedHeaders(body),
    body,
  }));

  assertEquals(response.status, 413);
});

Deno.test("rejects stale signed requests", async () => {
  Deno.env.set("SYNC_SECRET", "test-secret");
  const body = "[]";
  const staleTimestamp = Math.floor(Date.now() / 1000) - 301;
  const response = await handleRequest(new Request("http://localhost", {
    method: "POST",
    headers: await signedHeaders(body, staleTimestamp),
    body,
  }));

  assertEquals(response.status, 401);
});
