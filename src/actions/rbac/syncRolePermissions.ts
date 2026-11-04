import type { SupabaseClient } from "@supabase/supabase-js";

export async function syncRolePermissions(
  supabase: SupabaseClient,
  roleId: string,
  permissionKeys: string[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("role_permissions")
    .delete()
    .eq("role_id", roleId);
  if (deleteError) {
    throw deleteError;
  }

  if (permissionKeys.length === 0) {
    return;
  }

  const rows = permissionKeys.map((p) => ({
    role_id: roleId,
    permission_key: p,
  }));
  const { error: insertError } = await supabase.from("role_permissions").insert(rows);
  if (insertError) {
    throw insertError;
  }
}
