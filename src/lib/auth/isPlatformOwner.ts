import { createSupabaseAdminClient } from "@/lib/supabase";

export async function isPlatformOwner(userId?: string | null): Promise<boolean> {
  if (!userId) return false;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("user_role_assignments")
    .select("id, roles!inner(key)")
    .eq("user_id", userId)
    .eq("roles.key", "owner")
    // The platform owner is a GLOBAL assignment (school_id is null). A
    // school-scoped role that happens to be keyed "owner" is not one, and
    // 0040 now blocks creating one at all.
    .is("school_id", null)
    .limit(1)
    .maybeSingle();

  if (error || !data) return false;
  return true;
}
