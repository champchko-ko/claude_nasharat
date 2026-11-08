import type { SupabaseClient } from "@supabase/supabase-js";

/** Resolves a seeded global system role by its key. */
export async function resolveSystemRoleId(admin: SupabaseClient, roleKey: string): Promise<string> {
  const { data, error } = await admin
    .from("roles")
    .select("id")
    .eq("key", roleKey)
    .single();

  if (error || !data) {
    throw new Error(`E2E seed: system role "${roleKey}" is missing: ${error?.message ?? "no row"}`);
  }

  return data.id;
}
