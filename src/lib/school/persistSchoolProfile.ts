import type { SupabaseClient } from "@supabase/supabase-js";
import type { parseSchoolFormData } from "@/lib/validation/parseSchoolFormData";

export async function persistSchoolProfile(
  supabase: SupabaseClient,
  schoolId: string,
  parsed: ReturnType<typeof parseSchoolFormData>,
  logoPath: string | null,
): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();
  const schoolUpdates: Record<string, unknown> = {
    name_ar: parsed.nameAr,
    name_en: parsed.nameEn,
    phone: parsed.phone,
    email: parsed.email,
    manager_name_ar: parsed.managerNameAr,
    manager_name_en: parsed.managerNameEn,
    assistant_manager_ar: parsed.assistantManagerAr,
    assistant_manager_en: parsed.assistantManagerEn,
    assistant_manager_2_ar: parsed.assistantManager2Ar,
    assistant_manager_2_en: parsed.assistantManager2En,
    address_ar: parsed.addressAr,
    address_en: parsed.addressEn,
    updated_at: now,
    ...(parsed.slug ? { slug: parsed.slug } : {}),
  };

  if (logoPath) {
    schoolUpdates.logo_path = logoPath;
  }

  const { data: updatedSchool, error: schoolError } = await supabase
    .from("schools")
    .update(schoolUpdates)
    .eq("id", schoolId)
    .select("id");

  if (schoolError) {
    return { success: false, error: schoolError.message };
  }

  if (!updatedSchool || updatedSchool.length === 0) {
    return {
      success: false,
      error: "Failed to update school: record not found or insufficient permissions",
    };
  }

  const { error: settingsError } = await supabase.from("school_settings").upsert({
    school_id: schoolId,
    academic_year: parsed.academicYear,
    vision: parsed.visionAr ?? parsed.visionEn,
    mission: parsed.missionAr ?? parsed.missionEn,
    vision_ar: parsed.visionAr,
    vision_en: parsed.visionEn,
    mission_ar: parsed.missionAr,
    mission_en: parsed.missionEn,
    working_days: parsed.workingDays.length > 0 ? parsed.workingDays : [0, 1, 2, 3, 4],
    date_format: parsed.dateFormat,
    updated_at: now,
  });

  if (settingsError) {
    return { success: false, error: settingsError.message };
  }

  return { success: true };
}
