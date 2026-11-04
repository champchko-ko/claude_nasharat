import { describe, expect, it } from "vitest";
import { parseSchoolFormData } from "./parseSchoolFormData";

describe("parseSchoolFormData", () => {
  it("parses empty or partial FormData gracefully", () => {
    const formData = new FormData();
    formData.append("name_ar", "مدرسة الأمل");
    formData.append("name_en", "Al-Amal School");

    const parsed = parseSchoolFormData(formData);
    expect(parsed.nameAr).toBe("مدرسة الأمل");
    expect(parsed.nameEn).toBe("Al-Amal School");
    expect(parsed.slug).toBeNull();
    expect(parsed.phone).toBeNull();
    expect(parsed.email).toBeNull();
    expect(parsed.managerNameAr).toBeNull();
    expect(parsed.managerNameEn).toBeNull();
    expect(parsed.assistantManagerAr).toBeNull();
    expect(parsed.assistantManagerEn).toBeNull();
    expect(parsed.assistantManager2Ar).toBeNull();
    expect(parsed.assistantManager2En).toBeNull();
    expect(parsed.addressAr).toBeNull();
    expect(parsed.addressEn).toBeNull();
    expect(parsed.academicYear).toBeNull();
    expect(parsed.visionAr).toBeNull();
    expect(parsed.visionEn).toBeNull();
    expect(parsed.missionAr).toBeNull();
    expect(parsed.missionEn).toBeNull();
    expect(parsed.workingDays).toEqual([]);
    expect(parsed.dateFormat).toBe("yyyy-MM-dd");
    // Timezone field is intentionally omitted
    expect((parsed as Record<string, unknown>).timezone).toBeUndefined();
  });

  it("parses all leadership, contact, and bilingual narrative fields", () => {
    const formData = new FormData();
    formData.append("name_ar", "مدرسة النور");
    formData.append("name_en", "Al-Noor School");
    formData.append("slug", "al-noor");
    formData.append("phone", "+966 12 345 6789");
    formData.append("email", "info@alnoor.edu.sa");
    formData.append("manager_name_ar", "د. أحمد المنصور");
    formData.append("manager_name_en", "Dr. Ahmed Al-Mansoor");
    formData.append("assistant_manager_ar", "أ. خالد الحربي");
    formData.append("assistant_manager_en", "Mr. Khaled Al-Harbi");
    formData.append("assistant_manager_2_ar", "أ. سارة السالم");
    formData.append("assistant_manager_2_en", "Ms. Sarah Al-Salem");
    formData.append("address_ar", "الرياض، حي النرجس");
    formData.append("address_en", "Riyadh, Al-Narjis District");
    formData.append("academic_year", "2026/2027");
    formData.append("vision_ar", "بيئة تعليمية رائدة");
    formData.append("vision_en", "A leading educational environment");
    formData.append("mission_ar", "تنمية مهارات الجيل القادم");
    formData.append("mission_en", "Developing next-generation skills");

    formData.append("date_format", "dd/MM/yyyy");
    formData.append("working_days", "0");
    formData.append("working_days", "1");
    formData.append("working_days", "2");
    formData.append("working_days", "3");
    formData.append("working_days", "4");

    const parsed = parseSchoolFormData(formData);
    expect(parsed.nameAr).toBe("مدرسة النور");
    expect(parsed.nameEn).toBe("Al-Noor School");
    expect(parsed.slug).toBe("al-noor");
    expect(parsed.phone).toBe("+966 12 345 6789");
    expect(parsed.email).toBe("info@alnoor.edu.sa");
    expect(parsed.managerNameAr).toBe("د. أحمد المنصور");
    expect(parsed.managerNameEn).toBe("Dr. Ahmed Al-Mansoor");
    expect(parsed.assistantManagerAr).toBe("أ. خالد الحربي");
    expect(parsed.assistantManagerEn).toBe("Mr. Khaled Al-Harbi");
    expect(parsed.assistantManager2Ar).toBe("أ. سارة السالم");
    expect(parsed.assistantManager2En).toBe("Ms. Sarah Al-Salem");
    expect(parsed.addressAr).toBe("الرياض، حي النرجس");
    expect(parsed.addressEn).toBe("Riyadh, Al-Narjis District");
    expect(parsed.academicYear).toBe("2026/2027");
    expect(parsed.visionAr).toBe("بيئة تعليمية رائدة");
    expect(parsed.visionEn).toBe("A leading educational environment");
    expect(parsed.missionAr).toBe("تنمية مهارات الجيل القادم");
    expect(parsed.missionEn).toBe("Developing next-generation skills");
    expect(parsed.workingDays).toEqual([0, 1, 2, 3, 4]);
    expect(parsed.dateFormat).toBe("dd/MM/yyyy");
  });
});
