import { createSupabaseServerClient } from "@/lib/supabase";
import type { SchoolAchievementRow } from "./types";

export async function getSchoolAchievements(
  schoolId?: string | null,
): Promise<SchoolAchievementRow[]> {
  if (!schoolId) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("school_achievements")
    .select(
      `
      id,
      department_id,
      title_ar,
      title_en,
      description,
      category,
      date_achieved,
      visibility,
      image_path,
      created_by,
      created_at,
      updated_at,
      department:departments(id, name_ar, name_en),
      creator:profiles!created_by(id, full_name)
    `,
    )
    .order("date_achieved", { ascending: false });

  if (error || !data) return [];
  return data as unknown as SchoolAchievementRow[];
}
