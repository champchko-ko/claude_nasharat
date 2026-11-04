import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Rolls back newly created profile and authentication records
 * when user provisioning encounters downstream failures.
 */
export async function rollbackProvisionedUser(
  admin: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error: profileError } = await admin.from("profiles").delete().eq("id", userId);
  const { error: authError } = await admin.auth.admin.deleteUser(userId);

  if (profileError || authError) {
    const failures: string[] = [];
    if (profileError) failures.push(`profile delete failed: ${profileError.message}`);
    if (authError) failures.push(`auth user delete failed: ${authError.message}`);
    throw new Error(`Rollback failed for user ${userId}: ${failures.join("; ")}`);
  }
}
