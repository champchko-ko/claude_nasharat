import type { ProfileRow } from "./getCurrentProfile";

export function resolveDepartmentName(profile: ProfileRow | null, locale?: string): string | null {
  if (!profile?.department_id) return null;
  if (locale === "ar") {
    return (
      profile.department_name_ar || profile.department_name_en || profile.department_name || null
    );
  }
  return (
    profile.department_name_en || profile.department_name_ar || profile.department_name || null
  );
}
