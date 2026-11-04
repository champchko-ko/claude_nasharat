import type { SupabaseClient } from "@supabase/supabase-js";

export async function deleteAchievementRecord(
  supabase: SupabaseClient,
  achievementId: string,
  schoolId: string,
) {
  const { error } = await supabase
    .from("school_achievements")
    .delete()
    .eq("id", achievementId)
    .eq("school_id", schoolId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
