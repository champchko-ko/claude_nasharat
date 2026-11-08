import { toSchoolUserRow } from "./toSchoolUserRow";

export type RawProfileQueryResult = {
  id: string;
  full_name: string;
  email: string | null;
  phone?: string | null;
  job_title: string | null;
  department_id: string | null;
  is_active: boolean;
  departments: { name_ar: string; name_en: string } | null;
  user_role_assignments:
    | {
        roles: { key: string } | null;
      }
    | Array<{
    roles: { key: string } | null;
      }>
    | null;
};

export type MappedSchoolUser = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  department_id: string | null;
  department_name: string | null;
  is_active: boolean;
  role_key: string | null;
  is_owner: boolean;
};

export function mapSchoolUserRows(
  rows: RawProfileQueryResult[],
  _viewerIsOwner?: boolean,
  ownerUserIds?: Set<string>,
): MappedSchoolUser[] {
  const result: MappedSchoolUser[] = [];

  for (const row of rows) {
    const assignments = Array.isArray(row.user_role_assignments)
      ? row.user_role_assignments
      : row.user_role_assignments
        ? [row.user_role_assignments]
        : [];
    const isOwner = Boolean(
      (ownerUserIds && ownerUserIds.has(row.id)) ||
      assignments.some((assignment) => assignment.roles?.key === "owner"),
    );

    // The platform owner account must never appear in the school user list
    if (isOwner) {
      continue;
    }

    result.push(toSchoolUserRow(row, isOwner));
  }

  return result;
}
