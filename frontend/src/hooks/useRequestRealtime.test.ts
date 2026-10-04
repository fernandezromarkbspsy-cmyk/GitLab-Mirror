import { describe, expect, it, vi } from "vitest";
import { createRealtimeRecoveryTracker } from "./useRequestRealtime";

async function settleRecovery() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe("realtime reconnect recovery", () => {
  it("does not recover on initial subscriptions and recovers only once when both channels rejoin", async () => {
    const recover = vi.fn();
    const track = createRealtimeRecoveryTracker(recover);

    track("requests", "SUBSCRIBED");
    track("intraday", "SUBSCRIBED");
    expect(recover).not.toHaveBeenCalled();

    track("requests", "CLOSED");
    track("intraday", "CHANNEL_ERROR");
    track("requests", "SUBSCRIBED");
    track("intraday", "SUBSCRIBED");
    await settleRecovery();

    expect(recover).toHaveBeenCalledTimes(1);
    expect(recover).toHaveBeenCalledWith(new Set(["requests", "intraday"]));
  });

  it("does not treat an initial channel error as a reconnect", () => {
    const recover = vi.fn();
    const track = createRealtimeRecoveryTracker(recover);

    track("requests", "TIMED_OUT");
    track("requests", "SUBSCRIBED");

    expect(recover).not.toHaveBeenCalled();
  });

  it("recovers once for each separate reconnect", async () => {
    const recover = vi.fn();
    const track = createRealtimeRecoveryTracker(recover);

    track("requests", "SUBSCRIBED");
    track("requests", "CLOSED");
    track("requests", "SUBSCRIBED");
    await settleRecovery();

    track("requests", "TIMED_OUT");
    track("requests", "SUBSCRIBED");
    await settleRecovery();

    expect(recover).toHaveBeenCalledTimes(2);
  });

  it("recovers intraday data after an intraday-only reconnect", async () => {
    const recover = vi.fn();
    const track = createRealtimeRecoveryTracker(recover);

    track("intraday", "SUBSCRIBED");
    track("intraday", "TIMED_OUT");
    track("intraday", "SUBSCRIBED");
    await settleRecovery();

    expect(recover).toHaveBeenCalledTimes(1);
    expect(recover).toHaveBeenCalledWith(new Set(["intraday"]));
  });

  it("recovers notifications once after reconnect without refreshing initially", async () => {
    const recover = vi.fn();
    const track = createRealtimeRecoveryTracker(recover);

    track("notifications", "SUBSCRIBED");
    track("notifications", "SUBSCRIBED");
    expect(recover).not.toHaveBeenCalled();

    track("notifications", "CLOSED");
    track("notifications", "SUBSCRIBED");
    await settleRecovery();

    expect(recover).toHaveBeenCalledTimes(1);
    expect(recover).toHaveBeenCalledWith(new Set(["notifications"]));
  });
});
