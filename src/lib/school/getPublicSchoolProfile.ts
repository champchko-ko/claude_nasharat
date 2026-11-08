import { createSupabaseServerClient } from "@/lib/supabase";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";

export interface PublicSchoolProfileRow {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  logo_path: string | null;
  timezone?: string;
  phone?: string | null;
  email?: string | null;
  instagram_url?: string | null;
  manager_name_ar?: string | null;
  manager_name_en?: string | null;
  assistant_manager_ar?: string | null;
  assistant_manager_en?: string | null;
  assistant_manager_2_ar?: string | null;
  assistant_manager_2_en?: string | null;
  address_ar?: string | null;
  address_en?: string | null;
  academic_year?: string | null;
  public_description: string | null;
  vision: string | null;
  mission: string | null;
  vision_ar?: string | null;
  vision_en?: string | null;
  mission_ar?: string | null;
  mission_en?: string | null;
  objectives: string | null;
}

export async function getPublicSchoolProfile(
  schoolId?: string | null,
): Promise<PublicSchoolProfileRow | null> {
  const supabase = await createSupabaseServerClient();
  const query = supabase
    .from("public_school_profiles")
    .select(
      "id, name_ar, name_en, slug, logo_path, phone, email, manager_name_ar, manager_name_en, assistant_manager_ar, assistant_manager_en, assistant_manager_2_ar, assistant_manager_2_en, address_ar, address_en, academic_year, public_description, vision, mission, vision_ar, vision_en, mission_ar, mission_en, objectives",
    );

  const { data, error } = schoolId
    ? await query.eq("id", schoolId).maybeSingle()
    : await query.limit(1).maybeSingle();

  if (error) {
    throw mapDatabaseError(error);
  }

  return (data as PublicSchoolProfileRow | null) ?? null;
}
