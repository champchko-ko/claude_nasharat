import type { SupabaseClient } from "@supabase/supabase-js";

export async function verifyOtherActiveSchoolAdminsExist(
  adminClient: SupabaseClient,
  userId: string,
  schoolId: string,
): Promise<boolean> {
  const { data: userAdminRole } = await adminClient
    .from("user_role_assignments")
    .select("id, roles!inner(key)")
    .eq("user_id", userId)
    .eq("school_id", schoolId)
    .eq("roles.key", "school_admin")
    .maybeSingle();

  if (!userAdminRole) {
    return true;
  }

  const { data: otherAdmins } = await adminClient
    .from("user_role_assignments")
    .select("user_id, profiles!inner(is_active), roles!inner(key)")
    .eq("school_id", schoolId)
    .eq("roles.key", "school_admin")
    .eq("profiles.is_active", true)
    .neq("user_id", userId)
    .limit(1);

  return Boolean(otherAdmins && otherAdmins.length > 0);
}
