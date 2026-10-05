import { describe, expect, it } from "vitest";
import { formatElapsed } from "./RequestTable";

describe("request elapsed time", () => {
  it("runs until Driver ID assignment and then stops at its timestamp", () => {
    expect(formatElapsed("2026-10-05T08:00:00Z", null, new Date("2026-10-05T09:30:00Z"))).toBe("1h 30m");
    expect(formatElapsed("2026-10-05T08:00:00Z", "2026-10-05T08:42:00Z", new Date("2026-10-05T09:30:00Z"))).toBe("42m");
  });
});
