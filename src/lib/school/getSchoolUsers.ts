import { createSupabaseAdminClient } from "@/lib/supabase";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import {
  mapSchoolUserRows,
  type RawProfileQueryResult,
  type MappedSchoolUser,
} from "./mapSchoolUserRows";

export type SchoolUserRow = MappedSchoolUser;

/**
 * Reads the staff directory of one school with the service-role client.
 *
 * A school id is mandatory. The previous first-active-school fallback let any
 * caller with a null `school_id` read an arbitrary tenant's staff PII through
 * a client that bypasses RLS (audit finding B-3). Callers must resolve and
 * authorise the school before calling this.
 */
export async function getSchoolUsers(schoolId?: string | null): Promise<SchoolUserRow[]> {
  if (!schoolId) return [];

  const admin = createSupabaseAdminClient();

  const [{ data, error }, { data: ownerAssignments }] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "id, full_name, email, phone, job_title, department_id, is_active, departments:departments!profiles_department_id_fkey(name_ar, name_en), user_role_assignments:user_role_assignments!user_role_assignments_user_id_fkey(roles(key, name))",
      )
      .eq("school_id", schoolId)
      .order("full_name", { ascending: true }),
    admin
      .from("user_role_assignments")
      .select("user_id, roles!inner(key)")
      .eq("roles.key", "owner")
      .is("school_id", null),
  ]);

  if (error) {
    throw mapDatabaseError(error);
  }

  const ownerUserIds = new Set((ownerAssignments ?? []).map((a) => a.user_id));
  const rawRows = (data as unknown as RawProfileQueryResult[]) ?? [];
  return mapSchoolUserRows(rawRows, false, ownerUserIds);
}
