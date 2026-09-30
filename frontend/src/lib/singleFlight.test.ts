import { describe, expect, it } from "vitest";
import { createSingleFlight } from "./singleFlight";

describe("createSingleFlight", () => {
  it("shares a concurrent operation and permits a retry after failure", async () => {
    let calls = 0;
    let rejectFirst: ((cause: Error) => void) | undefined;
    const run = createSingleFlight(async () => {
      calls += 1;
      if (calls === 1) {
        return new Promise<string>((_, reject) => {
          rejectFirst = reject;
        });
      }
      return "ok";
    });

    const first = run();
    const second = run();
    expect(first).toBe(second);
    rejectFirst?.(new Error("first attempt failed"));
    await expect(first).rejects.toThrow("first attempt failed");

    await expect(run()).resolves.toBe("ok");
    expect(calls).toBe(2);
  });
});
