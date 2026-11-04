import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * A department id coming from the client must belong to the school that the
 * caller is allowed to manage. Without this check `provisionAuthUser` and
 * `persistUserUpdates` forwarded the raw id to the service-role client, which
 * could attach a user to a foreign tenant's department and change how
 * `has_permission(..., p_department)` evaluates for them (audit finding H-14).
 *
 * A null/empty department is always valid (the user simply has no department).
 */
export async function isDepartmentInSchool(
  supabase: SupabaseClient,
  departmentId: string | null | undefined,
  schoolId: string,
): Promise<boolean> {
  if (!departmentId) return true;

  const { data, error } = await supabase
    .from("departments")
    .select("id")
    .eq("id", departmentId)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}
