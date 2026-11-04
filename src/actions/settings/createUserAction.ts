"use server";

import { revalidateSettingsPath } from "@/lib/settings/revalidateSettingsPath";
import { assertCanManageSchoolUsers } from "@/lib/school/assertCanManageSchoolUsers";
import { assertDepartmentBelongsToSchool } from "@/lib/school/assertDepartmentBelongsToSchool";
import {
  sanitizeError,
  formatActionErrorResult,
  ValidationError,
  mapDatabaseError,
  type ActionResult,
} from "@/lib/errors";
import { provisionAuthUser } from "./provisionAuthUser";
import { validateCreateUserInput } from "./validateCreateUserInput";

export type CreateUserInput = {
  fullName: string;
  email: string;
  password: string;
  jobTitle?: string | null;
  departmentId?: string | null;
  roleKey: string;
};

export async function createUserAction(input: CreateUserInput): Promise<ActionResult> {
  try {
    const auth = await assertCanManageSchoolUsers();
    const val = validateCreateUserInput(
      input.fullName,
      input.email,
      input.password,
      input.roleKey || "staff",
    );
    if (!val.valid) {
      throw new ValidationError(val.error || "Invalid user input");
    }

    // A client-supplied department id must belong to the caller's school.
    await assertDepartmentBelongsToSchool(input.departmentId, auth.schoolId);

    const res = await provisionAuthUser({
      fullName: val.trimmedName,
      email: val.trimmedEmail,
      password: input.password,
      jobTitle: input.jobTitle,
      departmentId: input.departmentId,
      roleKey: input.roleKey || "staff",
      schoolId: auth.schoolId,
      callerId: auth.profileId,
    });

    if (!res.success) {
      throw mapDatabaseError(res.error, "Failed to create user");
    }

    revalidateSettingsPath("users");
    return { success: true };
  } catch (err: unknown) {
    const sanitized = sanitizeError(err, { action: "createUserAction", email: input.email });
    return formatActionErrorResult(sanitized);
  }
}
