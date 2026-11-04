import { createSupabaseAdminClient } from "@/lib/supabase";
import { assignUserRole } from "@/lib/school/assignUserRole";
import { rollbackProvisionedUser } from "./rollbackProvisionedUser";
import { createProvisionedAuthUser } from "./createProvisionedAuthUser";

export type ProvisionUserParams = {
  fullName: string;
  email: string;
  password: string;
  jobTitle?: string | null;
  departmentId?: string | null;
  roleKey: string;
  schoolId: string;
  callerId: string;
};

export async function provisionAuthUser(params: ProvisionUserParams) {
  const admin = createSupabaseAdminClient({ actorId: params.callerId });
  const authResult = await createProvisionedAuthUser(admin, params);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  const userId = authResult.userId;

  const { error: profileError } = await admin.from("profiles").upsert({
    id: userId,
    full_name: params.fullName,
    email: params.email,
    job_title: params.jobTitle?.trim() || null,
    department_id: params.departmentId || null,
    school_id: params.schoolId,
    is_active: true,
    invited_by: params.callerId,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    return { success: false, error: profileError.message };
  }

  try {
    await assignUserRole(
      admin,
      userId,
      params.schoolId,
      params.callerId,
      params.roleKey,
      params.departmentId,
    );
  } catch (roleErr) {
    await rollbackProvisionedUser(admin, userId);
    return {
      success: false,
      error: roleErr instanceof Error ? roleErr.message : "Failed to assign user role",
    };
  }

  return { success: true };
}
