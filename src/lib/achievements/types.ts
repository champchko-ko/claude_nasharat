export type AchievementCategory =
  "academic" | "competition" | "sports" | "scientific" | "community" | "other";

export type AchievementVisibility = "public" | "internal";

export interface SchoolAchievementRow {
  id: string;
  school_id: string;
  department_id: string | null;
  department?: {
    id: string;
    name_ar: string;
    name_en: string;
  } | null;
  title_ar: string;
  title_en: string | null;
  description: string | null;
  category: AchievementCategory;
  date_achieved: string;
  visibility: AchievementVisibility;
  image_path: string | null;
  created_by: string;
  creator?: {
    id: string;
    full_name: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAchievementInput {
  schoolId: string;
  departmentId?: string | null;
  titleAr: string;
  titleEn?: string | null;
  description?: string | null;
  category: AchievementCategory;
  dateAchieved: string;
  visibility: AchievementVisibility;
  imagePath?: string | null;
  createdBy: string;
}

export interface UpdateAchievementInput {
  id: string;
  departmentId?: string | null;
  titleAr: string;
  titleEn?: string | null;
  description?: string | null;
  category: AchievementCategory;
  dateAchieved: string;
  visibility: AchievementVisibility;
  imagePath?: string | null;
}
