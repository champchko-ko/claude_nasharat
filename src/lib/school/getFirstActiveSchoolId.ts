import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase";

/**
 * Resolves the one active school for this deployment, using the service role
 * as a fallback when the session cannot read the singleton row.
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
