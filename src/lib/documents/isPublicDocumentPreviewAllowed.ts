import type { SupabaseClient } from "@supabase/supabase-js";

export async function isPublicDocumentPreviewAllowed(
  client: SupabaseClient,
  schoolId: string,
  isPublished: boolean,
): Promise<boolean> {
  if (!isPublished) return false;

  const { data: school, error } = await client
    .from("schools")
    .select("is_active")
    .eq("id", schoolId)
    .maybeSingle();

  return !error && Boolean(school?.is_active);
}
