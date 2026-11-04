import type { SchoolRow } from "./getCurrentSchool";
import { resolveNarrativePair } from "./resolveNarrativePair";

export type SchoolSettingsRow = {
  academic_year?: string | null;
  vision?: string | null;
  mission?: string | null;
  vision_ar?: string | null;
  vision_en?: string | null;
  mission_ar?: string | null;
  mission_en?: string | null;
  public_description?: string | null;
  working_days?: number[] | null;
  date_format?: string | null;
  updated_at?: string | null;
};

export function mergeSchoolSettings(school: SchoolRow, settings: SchoolSettingsRow | null) {
  const defaultWorkingDays = [0, 1, 2, 3, 4];
  const defaultDateFormat = "yyyy-MM-dd";

  if (!settings) {
    return {
      ...school,
      academic_year: null,
      vision: null,
      mission: null,
      vision_ar: null,
      vision_en: null,
      mission_ar: null,
      mission_en: null,
      public_description: null,
      working_days: defaultWorkingDays,
      date_format: defaultDateFormat,
      updated_at: school.updated_at ?? null,
    };
  }

  const resolvedUpdatedAt =
    settings.updated_at && school.updated_at
      ? new Date(settings.updated_at) > new Date(school.updated_at)
        ? settings.updated_at
        : school.updated_at
      : (settings.updated_at ?? school.updated_at ?? null);

  return {
    ...school,
    academic_year: settings.academic_year,
    vision: resolveNarrativePair(settings.vision_ar, settings.vision),
    mission: resolveNarrativePair(settings.mission_ar, settings.mission),
    vision_ar: settings.vision_ar,
    vision_en: settings.vision_en,
    mission_ar: settings.mission_ar,
    mission_en: settings.mission_en,
    public_description: settings.public_description,
    working_days: settings.working_days ?? defaultWorkingDays,
    date_format: settings.date_format ?? defaultDateFormat,
    updated_at: resolvedUpdatedAt,
  };
}
