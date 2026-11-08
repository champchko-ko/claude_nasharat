export function resolveRoleDisplayName(
  roleKey: string | null | undefined,
  t: (key: string) => string,
  fallbackName?: string,
): string {
  if (!roleKey) return t("roleStaff");
  switch (roleKey) {
    case "staff":
      return t("roleStaff");
    case "department_head":
      return t("roleDeptHead");
    case "operator":
      return t("roleOperator");
    case "school_admin":
      return t("roleSchoolAdmin");
    case "owner":
      return t("roleOwner");
    default:
      return fallbackName || roleKey;
  }
}
