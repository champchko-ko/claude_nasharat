import { createSupabaseServerClient } from "@/lib/supabase";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";

/**
 * Whether the signed-in user holds `key`, optionally inside one department.
 *
 * The database decides (`has_permission`): the locked owner role holds every
 * permission, every other role holds exactly what the owner granted it, and a
 * department-bound assignment only holds a permission inside its own
 * department. The answer reflects the current grants, so a change made by the
 * owner applies immediately.
 *
 * `_legacySchoolId` exists only so call sites written for the multi-tenant
 * schema keep compiling while `school_id` is removed module by module. It is
 * ignored and will be deleted together with the last such call site.
 */
export async function hasPermission(
  key: string,
  _legacySchoolId?: string | null,
  departmentId?: string | null,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("has_permission", {
    p_permission: key,
    p_department: departmentId ?? null,
  });

  if (error) throw mapDatabaseError(error, "Permission check failed");
  return Boolean(data);
}
