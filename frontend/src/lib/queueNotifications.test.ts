import { describe, expect, it } from "vitest";
import { getNewQueueIds } from "./queueNotifications";

describe("getNewQueueIds", () => {
  it("treats the initial queue as a silent baseline", () => {
    expect(getNewQueueIds(null, new Set(["existing-1", "existing-2"]))).toEqual(
      [],
    );
  });

  it("reports entries added since the previous snapshot", () => {
    expect(
      getNewQueueIds(new Set(["existing"]), new Set(["existing", "new"])),
    ).toEqual(["new"]);
  });

  it("reports an entry again after it leaves and re-enters the queue", () => {
    const emptySnapshot = new Set<string>();
    expect(getNewQueueIds(emptySnapshot, new Set(["returned"]))).toEqual([
      "returned",
    ]);
  });
});
