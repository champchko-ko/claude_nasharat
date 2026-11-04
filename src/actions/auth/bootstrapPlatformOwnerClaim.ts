import type { SupabaseClient, User } from "@supabase/supabase-js";

export async function bootstrapPlatformOwnerClaim(
  supabase: SupabaseClient,
  admin: SupabaseClient,
  user: User,
): Promise<{ ok: boolean; error: string | null }> {
  const email = user.email ?? "";
  const fallbackName = email.split("@")[0] || "Owner";
  const fullName = (user.user_metadata?.full_name as string | undefined) ?? fallbackName;

  const { error: profileError } = await admin
    .from("profiles")
    .upsert({ id: user.id, full_name: fullName, email }, { onConflict: "id" });
  if (profileError) return { ok: false, error: "profile" };

  const { error: bootstrapError } = await supabase.rpc("bootstrap_platform_owner", {
    p_user_id: user.id,
  });
  if (bootstrapError) return { ok: false, error: "bootstrap" };

  return { ok: true, error: null };
}
