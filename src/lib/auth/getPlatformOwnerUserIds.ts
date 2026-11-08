import { createSupabaseAdminClient } from "@/lib/supabase";

export async function getPlatformOwnerUserIds(): Promise<Set<string>> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("user_role_assignments")
    .select("user_id, roles!inner(key)")
    .eq("roles.key", "owner");

  if (error || !data) {
    return new Set<string>();
  }

  return new Set(data.map((r: { user_id: string }) => r.user_id));
}
