import { describe, expect, it } from "vitest";
import { requestQueryKey } from "./requestRefresh";

describe("request refresh policy", () => {
  it("keeps request scopes independently addressable", () => {
    expect(requestQueryKey("outbound-all")).toEqual([
      "requests",
      "outbound-all",
    ]);
  });

  it("keeps the notification queue in the request invalidation family", () => {
    expect(requestQueryKey("notification-queue")).toEqual([
      "requests",
      "notification-queue",
    ]);
  });
});
