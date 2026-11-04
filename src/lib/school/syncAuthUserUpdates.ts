import type { SupabaseClient } from "@supabase/supabase-js";

export type AuthUpdateAttrs = {
  email?: string;
  password?: string;
  email_confirm?: boolean;
};

export async function syncAuthUserUpdates(
  adminClient: SupabaseClient,
  userId: string,
  newEmail?: string | null,
  newPassword?: string | null,
): Promise<{ success: boolean; error?: string }> {
  const attrs: AuthUpdateAttrs = {};

  if (newEmail && newEmail.trim()) {
    attrs.email = newEmail.trim().toLowerCase();
    attrs.email_confirm = true;
  }

  if (newPassword && newPassword.trim()) {
    if (newPassword.trim().length < 6) {
      return { success: false, error: "Password must be at least 6 characters" };
    }
    attrs.password = newPassword.trim();
  }

  if (Object.keys(attrs).length === 0) {
    return { success: true };
  }

  const { error } = await adminClient.auth.admin.updateUserById(userId, attrs);
  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
