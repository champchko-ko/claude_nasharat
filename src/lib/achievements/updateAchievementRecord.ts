import type { SupabaseClient } from "@supabase/supabase-js";
import type { UpdateAchievementInput } from "./types";

export async function updateAchievementRecord(
  supabase: SupabaseClient,
  input: UpdateAchievementInput,
): Promise<{ success: boolean; error?: string }> {
  const payload: Record<string, unknown> = {
    title_ar: input.titleAr,
    title_en: input.titleEn ?? null,
    description: input.description ?? null,
    department_id: input.departmentId ?? null,
    category: input.category,
    date_achieved: input.dateAchieved,
    visibility: input.visibility,
    updated_at: new Date().toISOString(),
  };

  if (input.imagePath !== undefined) {
    payload.image_path = input.imagePath;
  }

  const { error } = await supabase.from("school_achievements").update(payload).eq("id", input.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
