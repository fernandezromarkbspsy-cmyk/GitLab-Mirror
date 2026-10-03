import { describe, expect, it } from "vitest";
import {
  getRequestRefetchInterval,
  REQUEST_REFRESH_INTERVAL_MS,
  requestQueryKey,
} from "./requestRefresh";

describe("request refresh policy", () => {
  it("polls every 30 seconds while visible", () => {
    expect(getRequestRefetchInterval("visible")).toBe(
      REQUEST_REFRESH_INTERVAL_MS,
    );
  });

  it("pauses interval polling while hidden", () => {
    expect(getRequestRefetchInterval("hidden")).toBe(false);
  });

  it("keeps request scopes independently addressable", () => {
    expect(requestQueryKey("outbound-all")).toEqual([
      "requests",
      "outbound-all",
    ]);
  });
});
