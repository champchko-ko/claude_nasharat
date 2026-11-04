import { createSupabaseServerClient } from "@/lib/supabase";
import { isDepartmentInSchool } from "./isDepartmentInSchool";
import { ValidationError } from "@/lib/errors/ValidationError";

/**
 * Rejects a client-supplied department that does not belong to the school the
 * caller manages. A null department is valid and is a no-op.
 */
export async function assertDepartmentBelongsToSchool(
  departmentId: string | null | undefined,
  schoolId: string,
): Promise<void> {
  if (!departmentId) return;

  const supabase = await createSupabaseServerClient();
  const valid = await isDepartmentInSchool(supabase, departmentId, schoolId);
  if (!valid) {
    throw new ValidationError("The selected department does not belong to your school");
  }
}
