import { describe, it, expect } from "vitest";
import { parseSchoolNameHierarchy } from "./parseSchoolNameHierarchy";

describe("parseSchoolNameHierarchy", () => {
  it("returns empty strings for null or empty inputs", () => {
    expect(parseSchoolNameHierarchy(null)).toEqual({ hierarchy: null, primaryName: "" });
    expect(parseSchoolNameHierarchy("   ")).toEqual({ hierarchy: null, primaryName: "" });
  });

  it("handles single-line school names without hierarchy", () => {
    const result = parseSchoolNameHierarchy("Al-Amal High School");
    expect(result).toEqual({
      hierarchy: null,
      primaryName: "Al-Amal High School",
    });
  });

  it("splits multi-line Kuwait school names into hierarchy and primary name", () => {
    const raw = `دولة الكويت\nوزارة التربية\nمنطقة العاصمة التعليمية\nمدرسة الأمل الثانوية-بنات`;
    const result = parseSchoolNameHierarchy(raw);
    expect(result.hierarchy).toBe("دولة الكويت • وزارة التربية • منطقة العاصمة التعليمية");
    expect(result.primaryName).toBe("مدرسة الأمل الثانوية-بنات");
  });
});
