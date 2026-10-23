import { describe, expect, it } from "vitest";
import { canShowMidmileActions } from "./MidmileRequests";

describe("midmile request action eligibility", () => {
  it("requires selecting a requested row before showing FTE MM actions", () => {
    expect(canShowMidmileActions({ status: "REQUESTED" }, false)).toBe(false);
    expect(canShowMidmileActions({ status: "REQUESTED" }, true)).toBe(true);
    expect(canShowMidmileActions({ status: "DOCKING" }, true)).toBe(false);
  });
});
