"use server";

import { revalidateSettingsPath } from "@/lib/settings/revalidateSettingsPath";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { validateUserUpdateInput } from "@/lib/school/validateUserUpdateInput";
import { assertCanManageUser } from "@/lib/school/assertCanManageUser";
import { assertDepartmentBelongsToSchool } from "@/lib/school/assertDepartmentBelongsToSchool";
import { persistUserUpdates } from "@/lib/school/persistUserUpdates";
import { applyUserRoleUpdate } from "@/lib/school/applyUserRoleUpdate";
import { recordCredentialAudit } from "@/lib/audit/recordCredentialAudit";
import {
  sanitizeError,
  formatActionErrorResult,
  ForbiddenError,
  ValidationError,
  mapDatabaseError,
  type ActionResult,
} from "@/lib/errors";

export type UpdateUserInput = {
  userId: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  password?: string | null;
  jobTitle?: string | null;
  departmentId?: string | null;
  roleKey?: string | null;
  isActive?: boolean;
};

export async function updateUserAction(input: UpdateUserInput): Promise<ActionResult> {
  try {
    const check = await assertCanManageUser(input.userId, input.roleKey);
    if (!check.allowed || !check.schoolId || !check.currentUserId) {
      throw new ForbiddenError(check.error || "Unauthorized");
    }

    const val = validateUserUpdateInput(
      input.fullName,
      input.userId,
      check.currentUserId,
      input.isActive,
    );
    if (!val.valid) {
      throw new ValidationError(val.error || "Invalid user input");
    }

    await assertDepartmentBelongsToSchool(input.departmentId, check.schoolId);

    const adminClient = createSupabaseAdminClient({ actorId: check.currentUserId });
    const res = await persistUserUpdates(adminClient, check.schoolId, input);
    if (!res.success) {
      throw mapDatabaseError(res.error, "Failed to update user");
    }

    await applyUserRoleUpdate(
      input.userId,
      check.schoolId,
      check.currentUserId,
      input.roleKey,
      input.departmentId,
    );

    if (input.password) {
      await recordCredentialAudit({
        schoolId: check.schoolId,
        actorId: check.currentUserId,
        action: "credentials.password_reset",
        entityId: input.userId,
      });
    }

    revalidateSettingsPath("users");
    return { success: true };
  } catch (err: unknown) {
    const sanitized = sanitizeError(err, { action: "updateUserAction", userId: input.userId });
    return formatActionErrorResult(sanitized);
  }
}
