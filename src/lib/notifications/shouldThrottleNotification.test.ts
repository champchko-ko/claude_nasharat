import { describe, it, expect } from "vitest";
import { shouldThrottleNotification } from "./shouldThrottleNotification";

describe("shouldThrottleNotification", () => {
  it("does not throttle when there is no previous notification", () => {
    expect(shouldThrottleNotification(null)).toBe(false);
    expect(shouldThrottleNotification(undefined)).toBe(false);
  });

  it("throttles when previous notification was sent 5 minutes ago within a 15 min window", () => {
    const now = new Date("2026-10-23T12:00:00Z");
    const sentAt = new Date("2026-10-23T11:55:00Z");
    expect(shouldThrottleNotification(sentAt, 15, now)).toBe(true);
  });

  it("does not throttle when previous notification was sent 20 minutes ago within a 15 min window", () => {
    const now = new Date("2026-10-23T12:00:00Z");
    const sentAt = new Date("2026-10-23T11:40:00Z");
    expect(shouldThrottleNotification(sentAt, 15, now)).toBe(false);
  });

  it("handles ISO string format correctly", () => {
    const now = new Date("2026-10-23T12:00:00Z");
    const sentAt = "2026-10-23T11:50:00Z";
    expect(shouldThrottleNotification(sentAt, 15, now)).toBe(true);
  });
});
