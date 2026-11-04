import { describe, it, expect } from "vitest";
import { formatCircularDate } from "./formatCircularDate";

describe("formatCircularDate", () => {
  it("returns dash for null or undefined input", () => {
    expect(formatCircularDate(null)).toBe("—");
    expect(formatCircularDate(undefined)).toBe("—");
    expect(formatCircularDate("invalid-date")).toBe("—");
  });

  it("formats valid date string for en and ar locales", () => {
    const formattedEn = formatCircularDate("2026-10-22T10:00:00Z", "en");
    expect(formattedEn).toContain("2026");

    const formattedAr = formatCircularDate("2026-10-22T10:00:00Z", "ar");
    expect(formattedAr.length).toBeGreaterThan(0);
  });

  it("formats with custom dateFormat when supplied", () => {
    const formatted = formatCircularDate("2026-10-22T10:00:00Z", "en", "dd/MM/yyyy");
    expect(formatted).toBe("22/10/2026");
  });
});
