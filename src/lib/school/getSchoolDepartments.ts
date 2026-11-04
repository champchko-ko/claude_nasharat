import { createSupabaseServerClient } from "@/lib/supabase";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";

export type DepartmentRow = {
  id: string;
  school_id: string;
  name_ar: string;
  name_en: string;
  is_active: boolean;
  created_at: string;
};

export async function getSchoolDepartments(schoolId?: string | null): Promise<DepartmentRow[]> {
  if (!schoolId) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("departments")
    .select("id, school_id, name_ar, name_en, is_active, created_at")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: true });

  if (error) {
    throw mapDatabaseError(error);
  }

  return (data as DepartmentRow[]) ?? [];
}
