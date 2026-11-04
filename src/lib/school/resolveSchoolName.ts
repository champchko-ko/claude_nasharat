export function resolveSchoolName(
  school: { name_ar?: string | null; name_en?: string | null } | null | undefined,
  locale: string,
  fallback: string,
): string {
  if (!school) return fallback;
  if (locale === "ar") {
    return school.name_ar || school.name_en || fallback;
  }
  return school.name_en || school.name_ar || fallback;
}
