import { createSupabaseServerClient } from "@/lib/supabase";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";

async function loadEffectivePermissions(): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("effective_permission_keys");
  if (error) throw mapDatabaseError(error, "Failed to load permissions");
  return (data ?? []) as string[];
}

/**
 * Every permission key the signed-in user holds. The owner receives the whole
 * catalogue; everyone else receives what the owner granted their role.
 *
 * The optional argument is retained for compatibility with older callers and
 * is ignored because permissions are deployment-wide.
 */
export const getEffectivePermissions: (legacySchoolId?: string | null) => Promise<string[]> =
  loadEffectivePermissions;
