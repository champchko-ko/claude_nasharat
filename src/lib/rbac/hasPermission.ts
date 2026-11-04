import { createSupabaseServerClient } from "@/lib/supabase";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { logError } from "@/lib/logger";
import { getEffectivePermissions } from "./getEffectivePermissions";

export async function hasPermission(
  key: string,
  schoolId?: string | null,
  departmentId?: string | null,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("has_permission", {
    p_permission: key,
    p_school: schoolId ?? null,
    p_department: departmentId ?? null,
  });

  if (!error && Boolean(data)) {
    return true;
  }

  if (!departmentId) {
    try {
      const effective = await getEffectivePermissions(schoolId);
      if (effective.includes(key)) {
        return true;
      }
    } catch (fallbackError) {
      // The fallback is best effort: a failure here must not hide the RPC
      // result. It is logged so the real cause is never lost silently.
      logError(fallbackError, {
        scope: "hasPermission.effectivePermissionsFallback",
        permission: key,
        schoolId: schoolId ?? null,
      });
    }
  }

  if (error) throw mapDatabaseError(error, "Permission check failed");
  return Boolean(data);
}
