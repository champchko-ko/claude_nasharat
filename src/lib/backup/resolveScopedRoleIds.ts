import type { SupabaseClient } from "@supabase/supabase-js";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";

/**
 * Ids of the roles owned by a school, used to scope `role_permissions`.
 *
 * A missing school (platform scope) returns `null`; a school with no custom
 * roles returns `[]`, which callers treat as "nothing to read".
 */
export async function resolveScopedRoleIds(
  admin: SupabaseClient,
  schoolId: string | null,
): Promise<string[] | null> {
  if (!schoolId) return null;

  const { data, error } = await admin.from("roles").select("id");
  if (error) {
    throw mapDatabaseError(error, "Could not list the school's roles");
  }

  return ((data ?? []) as { id: string }[]).map((role) => role.id);
}
