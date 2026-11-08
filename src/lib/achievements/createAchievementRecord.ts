import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateAchievementInput } from "./types";

export async function createAchievementRecord(
  supabase: SupabaseClient,
  input: CreateAchievementInput,
) {
  const { data, error } = await supabase
    .from("school_achievements")
    .insert({
      department_id: input.departmentId || null,
      title_ar: input.titleAr,
      title_en: input.titleEn || null,
      description: input.description || null,
      category: input.category,
      date_achieved: input.dateAchieved,
      visibility: input.visibility,
      image_path: input.imagePath || null,
      created_by: input.createdBy,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message, id: null };
  }

  return { success: true, id: data.id };
}
