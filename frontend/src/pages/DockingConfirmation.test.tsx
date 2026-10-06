import { describe, expect, it } from "vitest";
import { canShowDriverAssignment, canShowTripAssignment } from "./DockingConfirmation";

describe("docking workflow gates", () => {
  it("only reveals the Doc Officer assignment after the docking checkbox", () => {
    expect(canShowDriverAssignment({ status: "DOCKING", driver_id: null }, false)).toBe(false);
    expect(canShowDriverAssignment({ status: "DOCKING", driver_id: null }, true)).toBe(true);
  });

  it("only reveals the Ops PIC trip action after Driver ID is present", () => {
    expect(canShowTripAssignment({ status: "DOCKING", driver_id: null }, "ops_pic")).toBe(false);
    expect(canShowTripAssignment({ status: "DOCKING", driver_id: "DRV-1" }, "ops_pic")).toBe(true);
  });
});
