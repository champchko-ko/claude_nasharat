import type { ProfileRow } from "./getCurrentProfile";

export type RawProfileResult = {
  id: string;
  full_name: string;
  email: string | null;
  job_title: string | null;
  department_id: string | null;
  is_active: boolean;
  departments: { id: string; name_ar: string; name_en: string } | null;
};

export function toProfileRow(row: RawProfileResult): ProfileRow {
  const dept = row.departments;
  const nameAr = dept?.name_ar ?? null;
  const nameEn = dept?.name_en ?? null;

  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    job_title: row.job_title,
    department_id: row.department_id,
    department_name_ar: nameAr,
    department_name_en: nameEn,
    department_name: nameAr || nameEn,
    is_active: row.is_active,
  };
}
