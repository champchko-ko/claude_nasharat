import { createSupabaseServerClient } from "@/lib/supabase";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";

export type DepartmentRow = {
  id: string;
  /** @deprecated There is one school; departments carry no school id. Never set. */
  school_id?: string;
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
 * The optional argument exists only so call sites written for the multi-tenant
 * schema keep compiling while `school_id` is removed module by module. It is
 * ignored: there is one school.
 */
export const getSchoolDepartments: (legacySchoolId?: string | null) => Promise<DepartmentRow[]> =
  loadDepartments;
