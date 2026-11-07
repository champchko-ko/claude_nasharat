import type { SupabaseClient } from "@supabase/supabase-js";

export async function insertRoleRow(
  supabase: SupabaseClient,
  params: {
    name: string;
    key: string;
    permissionKeys: string[];
  },
) {
  // The role screens take one name; both language columns get it. The owner can
  // give a custom role different Arabic and English names later.
  const { data: newRole, error: roleError } = await supabase
    .from("roles")
    .insert({
      name_ar: params.name,
      name_en: params.name,
      key: params.key,
      is_system: false,
    })
    .select("id")
    .single();

  if (roleError || !newRole) {
    return {
      success: false,
      error: roleError?.message ?? "Failed to create role",
    };
  }

  if (params.permissionKeys.length > 0) {
    const rows = params.permissionKeys.map((p) => ({
      role_id: newRole.id,
      permission_key: p,
    }));
    const { error: permError } = await supabase.from("role_permissions").insert(rows);
    if (permError) {
      await supabase.from("roles").delete().eq("id", newRole.id);
      return {
        success: false,
        error: `Failed to insert role permissions: ${permError.message}`,
      };
    }
  }

  return { success: true };
}
