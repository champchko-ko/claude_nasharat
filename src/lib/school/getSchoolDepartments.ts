import { createSupabaseServerClient } from "@/lib/supabase";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";

export type DepartmentRow = {
  id: string;
  name_ar: string;
  name_en: string;
  is_active: boolean;
  created_at: string;
};

async function loadDepartments(): Promise<DepartmentRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("departments")
    .select("id, name_ar, name_en, is_active, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw mapDatabaseError(error);
  }

  return (data as DepartmentRow[]) ?? [];
}

/**
 * All departments, oldest first.
 *
 * The optional argument is retained for compatibility with older callers and
 * is ignored because there is one school.
 */
export const getSchoolDepartments: (legacySchoolId?: string | null) => Promise<DepartmentRow[]> =
  loadDepartments;
