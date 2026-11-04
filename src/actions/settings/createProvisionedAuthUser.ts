import type { SupabaseClient } from "@supabase/supabase-js";

export type ProvisionAuthUserPayload = {
  email: string;
  password: string;
  fullName: string;
};

export async function createProvisionedAuthUser(
  admin: SupabaseClient,
  payload: ProvisionAuthUserPayload,
): Promise<{ userId: string } | { error: string }> {
  const { data, error } = await admin.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
    user_metadata: { full_name: payload.fullName },
  });

  if (error || !data.user) {
    return { error: error?.message ?? "Failed to create user account" };
  }

  return { userId: data.user.id };
}
