import { describe, expect, it } from "vitest";
import { formatDateTimeInput } from "./formatDateTimeInput";

describe("formatDateTimeInput", () => {
  it("returns empty string for null, undefined, or empty string", () => {
    expect(formatDateTimeInput(null)).toBe("");
    expect(formatDateTimeInput(undefined)).toBe("");
    expect(formatDateTimeInput("")).toBe("");
  });

  it("returns empty string for invalid date strings", () => {
    expect(formatDateTimeInput("invalid-date")).toBe("");
  });

  it("formats a valid date into YYYY-MM-DDTHH:mm pattern", () => {
    const formatted = formatDateTimeInput("2026-10-25T14:30:00Z");
    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});
