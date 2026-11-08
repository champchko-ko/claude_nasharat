import type { SupabaseClient } from "@supabase/supabase-js";
import { buildUserProfileUpdate } from "./buildUserProfileUpdate";
import { syncAuthUserUpdates } from "./syncAuthUserUpdates";

export type UpdateUserPersistInput = {
  userId: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  password?: string | null;
  jobTitle?: string | null;
  departmentId?: string | null;
  isActive?: boolean;
};

type PreviousProfile = {
  full_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  department_id: string | null;
  is_active: boolean;
};

/**
 * Updates a user.
 *
 * Order matters: the profile write happens first and is verified with a row
 * count, so an auth credential change is never applied to a user that does not
 * exist. If the auth update then fails, the profile row is restored to its
 * previous values.
 */
export async function persistUserUpdates(
  adminClient: SupabaseClient,
  input: UpdateUserPersistInput,
): Promise<{ success: boolean; error?: string }> {
  const { data: previous, error: readError } = await adminClient
    .from("profiles")
    .select("full_name, email, phone, job_title, department_id, is_active")
    .eq("id", input.userId)
    .maybeSingle<PreviousProfile>();

  if (readError) {
    return { success: false, error: readError.message };
  }
  if (!previous) {
    return { success: false, error: "User not found" };
  }

  const { data: updated, error } = await adminClient
    .from("profiles")
    .update(buildUserProfileUpdate(input))
    .eq("id", input.userId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }
  if (!updated) {
    return { success: false, error: "User not found" };
  }

  const authSync = await syncAuthUserUpdates(
    adminClient,
    input.userId,
    input.email,
    input.password,
  );
  if (!authSync.success) {
    // The profile write already succeeded; put it back so the caller sees a
    // single consistent state instead of a half-applied update.
    await adminClient
      .from("profiles")
      .update({ ...previous, updated_at: new Date().toISOString() })
      .eq("id", input.userId);

    return { success: false, error: authSync.error };
  }

  return { success: true };
}
