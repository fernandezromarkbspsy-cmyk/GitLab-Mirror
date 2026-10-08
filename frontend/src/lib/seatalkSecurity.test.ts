import { describe, expect, it } from "vitest";
import { isAllowedSeaTalkSdkUrl } from "./seatalkSecurity";

describe("isAllowedSeaTalkSdkUrl", () => {
  it("allows the configured HTTPS SeaTalk CDN origin", () => {
    expect(
      isAllowedSeaTalkSdkUrl(
        "https://static.cdn.haiserve.com/seatalk/client/shared/sop/auth.js",
      ),
    ).toBe(true);
  });

  it.each([
    "http://static.cdn.haiserve.com/sdk.js",
    "https://evil.example/sdk.js",
    "https://static.cdn.haiserve.com.evil.example/sdk.js",
    "not-a-url",
    "",
  ])("rejects an unsafe SDK URL: %s", (url) => {
    expect(isAllowedSeaTalkSdkUrl(url)).toBe(false);
  });
});
