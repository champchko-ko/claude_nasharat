import { describe, expect, it } from "vitest";
import { parseAchievementFormData } from "./parseAchievementFormData";

describe("parseAchievementFormData", () => {
  it("parses valid FormData with default fallback values", () => {
    const formData = new FormData();
    formData.append("title_ar", "فوز بالمركز الأول");

    const parsed = parseAchievementFormData(formData);
    expect(parsed.titleAr).toBe("فوز بالمركز الأول");
    expect(parsed.titleEn).toBeNull();
    expect(parsed.description).toBeNull();
    expect(parsed.departmentId).toBeNull();
    expect(parsed.category).toBe("academic");
    expect(parsed.visibility).toBe("internal");
    expect(parsed.dateAchieved).toBeDefined();
    expect(parsed.image).toBeNull();
  });

  it("parses complete FormData with all attributes", () => {
    const formData = new FormData();
    formData.append("title_ar", "أولمبياد الرياضيات");
    formData.append("title_en", "Math Olympiad Gold");
    formData.append("description", "تفاصيل الفوز بالميدالية الذهبية");
    formData.append("department_id", "dept-123");
    formData.append("category", "competition");
    formData.append("date_achieved", "2026-05-15");
    formData.append("visibility", "public");

    const parsed = parseAchievementFormData(formData);
    expect(parsed.titleAr).toBe("أولمبياد الرياضيات");
    expect(parsed.titleEn).toBe("Math Olympiad Gold");
    expect(parsed.description).toBe("تفاصيل الفوز بالميدالية الذهبية");
    expect(parsed.departmentId).toBe("dept-123");
    expect(parsed.category).toBe("competition");
    expect(parsed.dateAchieved).toBe("2026-05-15");
    expect(parsed.visibility).toBe("public");
  });

  it("throws ValidationError when title_ar is missing", () => {
    const formData = new FormData();
    formData.append("title_en", "Only English Title");

    expect(() => parseAchievementFormData(formData)).toThrow();
  });
});
