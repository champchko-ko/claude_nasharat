import type { SupabaseClient } from "@supabase/supabase-js";
import { buildUserProfileUpdate } from "./buildUserProfileUpdate";
import { syncAuthUserUpdates } from "./syncAuthUserUpdates";
import { assertNotLastActiveSchoolAdmin } from "./assertNotLastActiveSchoolAdmin";

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
 * Updates a user inside the caller's school.
 *
 * Order matters: the tenant-scoped profile write happens first and is verified
 * with a row count, so an auth credential change can never be applied to a
 * user outside the caller's school (audit finding C-1). If the auth update then
 * fails, the profile row is restored to its previous values.
 */
export async function persistUserUpdates(
  adminClient: SupabaseClient,
  schoolId: string,
  input: UpdateUserPersistInput,
): Promise<{ success: boolean; error?: string }> {
  const { data: previous, error: readError } = await adminClient
    .from("profiles")
    .select("full_name, email, phone, job_title, department_id, is_active")
    .eq("id", input.userId)
    .eq("school_id", schoolId)
    .maybeSingle<PreviousProfile>();

  if (readError) {
    return { success: false, error: readError.message };
  }
  if (!previous) {
    return { success: false, error: "User not found in this school" };
  }

  // The profile write uses the service-role client, which bypasses the
  // database's last-administrator trigger (M-10).
  if (input.isActive === false) {
    await assertNotLastActiveSchoolAdmin(adminClient, input.userId);
  }

  const { data: updated, error } = await adminClient
    .from("profiles")
    .update(buildUserProfileUpdate(input))
    .eq("id", input.userId)
    .eq("school_id", schoolId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }
  if (!updated) {
    return { success: false, error: "User not found in this school" };
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
      .eq("id", input.userId)
      .eq("school_id", schoolId);

    return { success: false, error: authSync.error };
  }

  return { success: true };
}
