import { describe, it, expect } from "vitest";
import { formatSchoolDate } from "./formatSchoolDate";

describe("formatSchoolDate", () => {
  const testDate = "2026-10-31T15:30:00Z";

  it("formats date as yyyy-MM-dd by default", () => {
    const formatted = formatSchoolDate(testDate);
    expect(formatted).toBe("2026-10-31");
  });

  it("formats date as dd/MM/yyyy when specified", () => {
    const formatted = formatSchoolDate(testDate, "dd/MM/yyyy");
    expect(formatted).toBe("31/10/2026");
  });

  it("formats date as MM/dd/yyyy when specified", () => {
    const formatted = formatSchoolDate(testDate, "MM/dd/yyyy");
    expect(formatted).toBe("10/31/2026");
  });

  it("handles null and invalid dates gracefully", () => {
    expect(formatSchoolDate(null)).toBe("—");
    expect(formatSchoolDate(undefined)).toBe("—");
    expect(formatSchoolDate("not-a-date")).toBe("—");
  });
});
