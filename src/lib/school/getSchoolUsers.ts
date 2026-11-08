import { createSupabaseAdminClient } from "@/lib/supabase";
import { getPlatformOwnerUserIds } from "@/lib/auth/getPlatformOwnerUserIds";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import {
  mapSchoolUserRows,
  type RawProfileQueryResult,
  type MappedSchoolUser,
} from "./mapSchoolUserRows";

export type SchoolUserRow = MappedSchoolUser;

async function loadSchoolUsers(): Promise<SchoolUserRow[]> {
  const admin = createSupabaseAdminClient();

  const [{ data, error }, ownerUserIds] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "id, full_name, email, phone, job_title, department_id, is_active, departments:departments!profiles_department_id_fkey(name_ar, name_en), user_role_assignments:user_role_assignments!user_role_assignments_user_id_fkey(roles(key))",
      )
      .order("full_name", { ascending: true }),
    getPlatformOwnerUserIds(),
  ]);

  if (error) {
    throw mapDatabaseError(error);
  }

  const rawRows = (data as unknown as RawProfileQueryResult[]) ?? [];
  // Owner accounts never appear in the user list.
  return mapSchoolUserRows(rawRows, false, ownerUserIds);
}

/**
 * The staff directory, read with the service-role client. Callers must have
 * authorised the request first (the Users screen checks `users.manage`).
 *
 * The optional argument is retained for compatibility with older callers and
 * is ignored because there is one school.
 */
export const getSchoolUsers: (legacySchoolId?: string | null) => Promise<SchoolUserRow[]> =
  loadSchoolUsers;
