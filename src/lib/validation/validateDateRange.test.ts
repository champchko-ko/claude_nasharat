import { describe, expect, it } from "vitest";
import { validateDateRange } from "./validateDateRange";

describe("validateDateRange", () => {
  it("returns true when endsAt is after startsAt", () => {
    expect(validateDateRange("2026-10-24T09:00:00Z", "2026-10-24T10:00:00Z")).toBe(true);
  });

  it("returns true when endsAt equals startsAt", () => {
    expect(validateDateRange("2026-10-24T09:00:00Z", "2026-10-24T09:00:00Z")).toBe(true);
  });

  it("returns false when endsAt is before startsAt", () => {
    expect(validateDateRange("2026-10-24T10:00:00Z", "2026-10-24T09:00:00Z")).toBe(false);
  });

  it("returns false for invalid date strings", () => {
    expect(validateDateRange("invalid", "2026-10-24T09:00:00Z")).toBe(false);
  });
});
