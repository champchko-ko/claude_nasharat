import type { SchoolFullDetails } from "@/lib/school/getSchoolFullDetails";
import type { ProfileRow } from "@/lib/auth/getCurrentProfile";

export interface DashboardSchoolMeta {
  schoolNameAr: string;
  schoolNameEn: string;
  managerName: string;
  visionText: string;
}

function resolveSchoolNameAr(school: SchoolFullDetails | null): string {
  if (!school?.name_ar) return "مدرسة الأمل الثانوية-بنات";
  const parts = school.name_ar.split("\n");
  return parts[3] ? parts[3] : school.name_ar;
}

function resolveSchoolNameEn(school: SchoolFullDetails | null): string {
  if (!school?.name_en) return "Al-Amal High School";
  const parts = school.name_en.split("\n");
  return parts[3] ? parts[3] : school.name_en;
}

function resolveManagerName(school: SchoolFullDetails | null, profile: ProfileRow | null): string {
  if (profile?.full_name) return profile.full_name;
  if (school?.manager_name_ar) return school.manager_name_ar;
  return "أ. سلوى العنزي";
}

function resolveVisionText(school: SchoolFullDetails | null): string {
  if (school?.vision_ar) return school.vision_ar;
  if (school?.vision) return school.vision;
  return "الريادة والتميز في بيئة تعليمية محفزة";
}

export function resolveDashboardSchoolMeta(
  school: SchoolFullDetails | null,
  profile: ProfileRow | null,
): DashboardSchoolMeta {
  return {
    schoolNameAr: resolveSchoolNameAr(school),
    schoolNameEn: resolveSchoolNameEn(school),
    managerName: resolveManagerName(school, profile),
    visionText: resolveVisionText(school),
  };
}
