import { describe, expect, it } from "vitest";
import { getPublicCalendarCategoryStyle } from "./getPublicCalendarCategoryStyle";

describe("getPublicCalendarCategoryStyle", () => {
  it("returns exam styles for exam category", () => {
    const style = getPublicCalendarCategoryStyle("exam");
    expect(style.labelAr).toBe("امتحانات عامة");
    expect(style.labelEn).toBe("General Exams");
    expect(style.dotClass).toContain("bg-purple");
  });

  it("returns academic styles for academic category", () => {
    const style = getPublicCalendarCategoryStyle("academic");
    expect(style.labelAr).toBe("جدول أكاديمي");
    expect(style.labelEn).toBe("Academic Schedule");
  });

  it("returns meeting styles for meeting category", () => {
    const style = getPublicCalendarCategoryStyle("meeting");
    expect(style.labelAr).toBe("اجتماع إداري");
    expect(style.labelEn).toBe("Admin Meeting");
  });

  it("returns bulletin styles for circular/bulletin category", () => {
    const style = getPublicCalendarCategoryStyle("bulletin");
    expect(style.labelAr).toBe("نشرة عامة");
    expect(style.labelEn).toBe("Public Bulletin");
  });

  it("returns default event styles for unknown/other category", () => {
    const style = getPublicCalendarCategoryStyle("other");
    expect(style.labelAr).toBe("فعالية عامة");
    expect(style.labelEn).toBe("General Event");
  });
});

