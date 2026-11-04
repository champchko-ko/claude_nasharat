import { describe, expect, it } from "vitest";
import { mergeSchoolSettings } from "./mergeSchoolSettings";
import type { SchoolRow } from "./getCurrentSchool";

describe("mergeSchoolSettings", () => {
  const mockSchool: SchoolRow = {
    id: "school-123",
    name_ar: "مدرسة الصديق",
    name_en: "Al-Siddiq School",
    slug: "al-siddiq",
    timezone: "Asia/Kuwait",
    logo_path: null,
    is_active: true,
    phone: null,
    email: null,
    manager_name_ar: null,
    manager_name_en: null,
    assistant_manager_ar: null,
    assistant_manager_en: null,
    assistant_manager_2_ar: null,
    assistant_manager_2_en: null,
    address_ar: null,
    address_en: null,
  };

  it("applies default working days and date format when settings are null", () => {
    const merged = mergeSchoolSettings(mockSchool, null);

    expect(merged.name_ar).toBe("مدرسة الصديق");
    expect(merged.working_days).toEqual([0, 1, 2, 3, 4]);
    expect(merged.date_format).toBe("yyyy-MM-dd");
    expect(merged.academic_year).toBeNull();
  });

  it("merges custom settings correctly", () => {
    const merged = mergeSchoolSettings(mockSchool, {
      academic_year: "2026/2027",
      working_days: [0, 1, 2, 3],
      date_format: "dd/MM/yyyy",
      vision_ar: "رؤية المدرسة",
      vision_en: "School Vision",
      mission_ar: "رسالة المدرسة",
      mission_en: "School Mission",
      public_description: "وصف عام",
    });

    expect(merged.academic_year).toBe("2026/2027");
    expect(merged.working_days).toEqual([0, 1, 2, 3]);
    expect(merged.date_format).toBe("dd/MM/yyyy");
    expect(merged.vision).toBe("رؤية المدرسة");
    expect(merged.mission).toBe("رسالة المدرسة");
  });

  it("selects the newest updated_at between school and settings", () => {
    const olderSchool = { ...mockSchool, updated_at: "2026-01-01T00:00:00.000Z" };
    const merged = mergeSchoolSettings(olderSchool, {
      updated_at: "2026-06-01T00:00:00.000Z",
    });
    expect(merged.updated_at).toBe("2026-06-01T00:00:00.000Z");
  });
});
