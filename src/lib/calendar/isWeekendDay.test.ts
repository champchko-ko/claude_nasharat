import { describe, expect, it } from "vitest";
import { isWeekendDay } from "./isWeekendDay";

describe("isWeekendDay", () => {
  it("identifies Friday (5) as a weekend day by default", () => {
    // 2026-11-20 is Friday
    expect(isWeekendDay("2026-11-20")).toBe(true);
    expect(isWeekendDay("2026-11-20T10:00:00")).toBe(true);
    expect(isWeekendDay(new Date(2026, 10, 20))).toBe(true);
  });

  it("identifies Saturday (6) as a weekend day by default", () => {
    // 2026-11-21 is Saturday
    expect(isWeekendDay("2026-11-21")).toBe(true);
    expect(isWeekendDay("2026-11-28T14:30:00")).toBe(true);
    expect(isWeekendDay(new Date(2026, 10, 21))).toBe(true);
  });

  it("identifies Sunday through Thursday as working days by default", () => {
    // 2026-11-22 is Sunday
    expect(isWeekendDay("2026-11-22")).toBe(false);
    // 2026-11-23 is Monday
    expect(isWeekendDay("2026-11-23")).toBe(false);
    // 2026-11-24 is Tuesday
    expect(isWeekendDay("2026-11-24")).toBe(false);
    // 2026-11-25 is Wednesday
    expect(isWeekendDay("2026-11-25")).toBe(false);
    // 2026-11-26 is Thursday
    expect(isWeekendDay("2026-11-26")).toBe(false);
  });

  it("respects custom workingDays configuration", () => {
    // Monday-Friday work week: [1, 2, 3, 4, 5]
    const monFri = [1, 2, 3, 4, 5];
    // Friday (2026-11-20) is a working day
    expect(isWeekendDay("2026-11-20", monFri)).toBe(false);
    // Sunday (2026-11-22) is a weekend day
    expect(isWeekendDay("2026-11-22", monFri)).toBe(true);
    // Saturday (2026-11-21) is a weekend day
    expect(isWeekendDay("2026-11-21", monFri)).toBe(true);
  });

  it("handles null, undefined, and invalid date formats gracefully", () => {
    expect(isWeekendDay(null)).toBe(false);
    expect(isWeekendDay(undefined)).toBe(false);
    expect(isWeekendDay("")).toBe(false);
    expect(isWeekendDay("invalid-date")).toBe(false);
  });
});
