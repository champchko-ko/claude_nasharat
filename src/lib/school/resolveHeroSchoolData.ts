import type { PublicSchoolProfileRow } from "./getPublicSchoolProfile";
import { resolveLocalizedText } from "./resolveLocalizedText";

export interface HeroSchoolData {
  vision: string | null;
  mission: string | null;
  manager: string | null;
  assistant1: string | null;
  assistant2: string | null;
}

export function resolveHeroSchoolData(
  school: PublicSchoolProfileRow | null,
  locale: string,
): HeroSchoolData {
  if (!school) {
    return {
      vision: null,
      mission: null,
      manager: null,
      assistant1: null,
      assistant2: null,
    };
  }

  return {
    vision: resolveLocalizedText(locale, school.vision_ar, school.vision_en, school.vision),
    mission: resolveLocalizedText(locale, school.mission_ar, school.mission_en, school.mission),
    manager: resolveLocalizedText(locale, school.manager_name_ar, school.manager_name_en),
    assistant1: resolveLocalizedText(
      locale,
      school.assistant_manager_ar,
      school.assistant_manager_en,
    ),
    assistant2: resolveLocalizedText(
      locale,
      school.assistant_manager_2_ar,
      school.assistant_manager_2_en,
    ),
  };
}
