import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase";

/**
 * Resolves the fallback tenant for a platform owner.
 *
 * A platform owner has no `school_id` of their own. It attempts resolution
 * via the session client first, and falls back to the service-role client
 * to guarantee platform owners can administer school resources even when
 * tenancy resolution is unassigned.
 */
export async function getFirstActiveSchoolId(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("schools")
      .select("id")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!error && data?.id) {
      return data.id;
    }
  } catch {
    // fall back to admin query below
  }

  const admin = createSupabaseAdminClient();
  const { data: adminData } = await admin
    .from("schools")
    .select("id")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return adminData?.id ?? null;
}
