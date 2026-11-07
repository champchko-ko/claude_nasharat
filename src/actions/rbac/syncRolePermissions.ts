import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Makes a role hold exactly `permissionKeys`.
 *
 * Only the difference is written: new grants are added first and removed ones
 * deleted afterwards, so a failure part-way (for example an unknown key) can
 * never leave a role with no permissions. Permission changes apply immediately
 * to signed-in users, which is why this must not be delete-all-then-insert.
 */
export async function syncRolePermissions(
  supabase: SupabaseClient,
  roleId: string,
  permissionKeys: string[],
): Promise<void> {
  const { data: current, error: readError } = await supabase
    .from("role_permissions")
    .select("permission_key")
    .eq("role_id", roleId);
  if (readError) {
    throw readError;
  }

  const existing = new Set<string>(
    (current ?? []).map((r: { permission_key: string }) => r.permission_key),
  );
  const desired = new Set<string>(permissionKeys);
  const toAdd = [...desired].filter((k) => !existing.has(k));
  const toRemove = [...existing].filter((k) => !desired.has(k));

  if (toAdd.length > 0) {
    const rows = toAdd.map((p) => ({ role_id: roleId, permission_key: p }));
    const { error: insertError } = await supabase.from("role_permissions").insert(rows);
    if (insertError) {
      throw insertError;
    }
  }

  if (toRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from("role_permissions")
      .delete()
      .eq("role_id", roleId)
      .in("permission_key", toRemove);
    if (deleteError) {
      throw deleteError;
    }
  }
}
