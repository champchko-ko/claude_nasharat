import { createSupabaseAdminClient } from "@/lib/supabase";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";

export async function hasAnyPlatformOwner(): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  // `roles.key` is a joined column: it can only be filtered when `roles` is
  // declared as an embedded resource. Without `!inner` PostgREST rejects the
  // request (PGRST108) and returns no rows; discarding `error` then made this
  // always report `false` (finding C1).
  const { count, error } = await admin
    .from("user_role_assignments")
    .select("id, roles!inner(key)", { count: "exact", head: true })
    .eq("roles.key", "owner");
  if (error) throw mapDatabaseError(error, "Platform owner check failed");
  return (count ?? 0) > 0;
}
