import { cleanFormField } from "./cleanFormField";

export function parseSchoolFormData(formData: FormData) {
  return {
    nameAr: cleanFormField(formData.get("name_ar")) ?? "",
    nameEn: cleanFormField(formData.get("name_en")) ?? "",
    slug: cleanFormField(formData.get("slug")),
    phone: cleanFormField(formData.get("phone")),
    email: cleanFormField(formData.get("email")),
    managerNameAr: cleanFormField(formData.get("manager_name_ar")),
    managerNameEn: cleanFormField(formData.get("manager_name_en")),
    assistantManagerAr: cleanFormField(formData.get("assistant_manager_ar")),
    assistantManagerEn: cleanFormField(formData.get("assistant_manager_en")),
    assistantManager2Ar: cleanFormField(formData.get("assistant_manager_2_ar")),
    assistantManager2En: cleanFormField(formData.get("assistant_manager_2_en")),
    addressAr: cleanFormField(formData.get("address_ar")),
    addressEn: cleanFormField(formData.get("address_en")),
    academicYear: cleanFormField(formData.get("academic_year")),
    visionAr: cleanFormField(formData.get("vision_ar")),
    visionEn: cleanFormField(formData.get("vision_en")),
    missionAr: cleanFormField(formData.get("mission_ar")),
    missionEn: cleanFormField(formData.get("mission_en")),
    workingDays: formData
      .getAll("working_days")
      .map(Number)
      .filter((n) => !isNaN(n) && n >= 0 && n <= 6),
    dateFormat: cleanFormField(formData.get("date_format")) ?? "yyyy-MM-dd",
  };
}
