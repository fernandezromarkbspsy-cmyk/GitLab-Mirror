import { describe, expect, it } from "vitest";
import { formatLocalDate } from "./date";

describe("formatLocalDate", () => {
  it("uses local calendar fields without converting through UTC", () => {
    expect(formatLocalDate(new Date(2026, 8, 7, 23, 59))).toBe("2026-09-07");
  });
});
