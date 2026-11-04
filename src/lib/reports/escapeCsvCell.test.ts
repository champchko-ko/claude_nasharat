import { describe, it, expect } from "vitest";
import { escapeCsvCell } from "./escapeCsvCell";

describe("escapeCsvCell", () => {
  it("converts null and undefined to empty strings", () => {
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
  });

  it("handles numbers and simple text safely", () => {
    expect(escapeCsvCell(123)).toBe("123");
    expect(escapeCsvCell("clean text")).toBe("clean text");
  });

  it("escapes CSV formula injection triggers (=, +, -, @, tab, cr)", () => {
    expect(escapeCsvCell("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
    expect(escapeCsvCell("+1234")).toBe("'+1234");
    expect(escapeCsvCell("-cmd")).toBe("'-cmd");
    expect(escapeCsvCell("@dangerous")).toBe("'@dangerous");
    expect(escapeCsvCell("\tsneaky")).toBe("'\tsneaky");
    expect(escapeCsvCell("\rsneaky")).toBe('"\'\rsneaky"');
  });

  it("quotes strings with commas, quotes, and newlines", () => {
    expect(escapeCsvCell("Hello, World")).toBe('"Hello, World"');
    expect(escapeCsvCell('He said "Hello"')).toBe('"He said ""Hello"""');
    expect(escapeCsvCell("Line 1\nLine 2")).toBe('"Line 1\nLine 2"');
  });

  it("preserves Arabic text integrity", () => {
    const arabicText = "تعميم إداري رقم 2026";
    expect(escapeCsvCell(arabicText)).toBe(arabicText);

    const arabicWithComma = "صيانة مكيفات, الدور الثاني";
    expect(escapeCsvCell(arabicWithComma)).toBe('"صيانة مكيفات, الدور الثاني"');
  });
});
