import type { SupabaseClient } from "@supabase/supabase-js";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { NotFoundError } from "@/lib/errors/NotFoundError";
import { ValidationError } from "@/lib/errors/ValidationError";

interface RoleMatch {
  id: string;
  school_id: string | null;
}

export async function resolveRoleForAssignment(
  supabase: SupabaseClient,
  roleKey: string,
  schoolId: string,
): Promise<string> {
  if (!/^[a-zA-Z0-9-]+$/.test(schoolId)) {
    throw new ValidationError("Invalid school identifier format");
  }

  const { data: roles, error: roleError } = await supabase
    .from("roles")
    .select("id, school_id")
    .eq("key", roleKey)
    .or(`school_id.eq.${schoolId},school_id.is.null`);

  if (roleError) {
    throw mapDatabaseError(roleError, `Failed to resolve role '${roleKey}'`);
  }

  const role =
    roles?.find((r: RoleMatch) => r.school_id === schoolId) ??
    roles?.find((r: RoleMatch) => r.school_id === null);

  if (!role) {
    throw new NotFoundError(`Role '${roleKey}' was not found for school '${schoolId}'`);
  }

  return role.id;
}
