import { createSupabaseServerClient } from "@/lib/supabase";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { getFirstActiveSchoolId } from "./getFirstActiveSchoolId";

export type SchoolRow = {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  timezone: string;
  logo_path: string | null;
  is_active: boolean;
  phone?: string | null;
  email?: string | null;
  manager_name_ar?: string | null;
  manager_name_en?: string | null;
  assistant_manager_ar?: string | null;
  assistant_manager_en?: string | null;
  assistant_manager_2_ar?: string | null;
  assistant_manager_2_en?: string | null;
  address_ar?: string | null;
  address_en?: string | null;
  academic_year?: string | null;
  updated_at?: string | null;
};

const SCHOOL_FIELDS =
  "id, name_ar, name_en, slug, timezone, logo_path, is_active, phone, email, manager_name_ar, manager_name_en, assistant_manager_ar, assistant_manager_en, assistant_manager_2_ar, assistant_manager_2_en, address_ar, address_en, updated_at";

export async function getCurrentSchool(schoolId?: string | null): Promise<SchoolRow | null> {
  const supabase = await createSupabaseServerClient();
  let targetId = schoolId;

  if (targetId === undefined) {
    targetId = await getFirstActiveSchoolId();
  }
  if (!targetId) {
    return null;
  }

  const { data, error } = await supabase
    .from("schools")
    .select(SCHOOL_FIELDS)
    .eq("id", targetId)
    .maybeSingle();

  if (error) {
    throw mapDatabaseError(error);
  }

  const school = (data as SchoolRow | null) ?? null;

  if (school) {
    const { data: settings, error: settingsError } = await supabase
      .from("school_settings")
      .select("academic_year")
      .eq("school_id", school.id)
      .maybeSingle();

    if (settingsError) {
      throw mapDatabaseError(settingsError);
    }

    if (settings?.academic_year) {
      school.academic_year = settings.academic_year;
    }
  }

  return school;
}
