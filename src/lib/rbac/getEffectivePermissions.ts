import { createSupabaseServerClient } from "@/lib/supabase";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";

/**
 * The caller's effective permission keys.
 *
 * Passing a school restricts the result to platform-wide assignments plus the
 * assignments held in that school (migration 0048, finding M10). Omitting it
 * returns everything the caller holds anywhere, which is only appropriate for
 * platform-level checks.
 */
export async function getEffectivePermissions(schoolId?: string | null): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "effective_permission_keys",
    schoolId ? { p_school: schoolId } : undefined,
  );
  if (error) {
    if (schoolId && error.code === "PGRST202") {
      const fallback = await supabase.rpc("effective_permission_keys");
      if (!fallback.error) return (fallback.data ?? []) as string[];
    }
    throw mapDatabaseError(error, "Failed to load permissions");
  }
  return (data ?? []) as string[];
}
