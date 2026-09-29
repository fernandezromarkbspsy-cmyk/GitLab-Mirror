import { describe, expect, it } from "vitest";
import { buildIdempotencyHeaders, generateIdempotencyKey } from "./idempotency";

describe("idempotency keys", () => {
  it("stays stable for retries of the same operation", () => {
    const first = generateIdempotencyKey(
      "outbound-create",
      {
        cluster: "DLX",
        dock_no: "D-12",
        backlogs: 3,
      },
      "operation-1",
    );
    const second = generateIdempotencyKey(
      "outbound-create",
      {
        dock_no: "D-12",
        cluster: "DLX",
        backlogs: 3,
      },
      "operation-1",
    );

    expect(first).toBe(second);
    expect(first).toMatch(/^outbound-create:/);
  });

  it("uses different keys for separate operations with the same payload", () => {
    const payload = { cluster: "DLX", backlogs: 3 };

    expect(generateIdempotencyKey("outbound-create", payload)).not.toBe(
      generateIdempotencyKey("outbound-create", payload),
    );
  });

  it("builds a header payload for fetch requests", () => {
    const payload = {
      requestId: "abc-123",
      payload: { driver_id: "d-1" },
    };
    const headers = buildIdempotencyHeaders(
      "midmile-assign",
      payload,
      "operation-2",
    );

    expect(headers["Idempotency-Key"]).toBe(
      generateIdempotencyKey("midmile-assign", payload, "operation-2"),
    );
  });
});
