import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Confirms that `userId` is an active member of `schoolId`.
 *
 * Used before a service-role side effect (maintenance assignment, notification
 * dispatch) accepts a user id that came from the client, so a foreign id cannot
 * be used to reach into another tenant (audit findings H-12 and M-8).
 */
export async function isActiveSchoolMember(
  supabase: SupabaseClient,
  userId: string,
  schoolId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}
