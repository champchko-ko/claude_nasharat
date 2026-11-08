import { ValidationError } from "@/lib/errors/ValidationError";
import type { RoleForAssignment } from "./resolveRoleForAssignment";

/**
 * The department an assignment should carry.
 *
 * - A system role that does not need a department (the school administrator,
 *   the technician) is always school-wide: any department is dropped, because a
 *   department on such an assignment would wrongly limit the permissions it grants.
 * - A role flagged `requires_department` must have one.
 * - Custom roles keep the department they are given, so the owner's choice at
 *   assignment time decides their scope.
 *
 * `undefined` means "leave the existing department unchanged".
 */
export function resolveAssignmentDepartment(
  role: RoleForAssignment,
  departmentId?: string | null,
): string | null | undefined {
  const effective = role.isSystem && !role.requiresDepartment ? null : departmentId;

  if (role.requiresDepartment && effective !== undefined && !effective) {
    throw new ValidationError("This role requires a department");
  }

  return effective;
}
