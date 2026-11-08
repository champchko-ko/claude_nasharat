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
  "id, name_ar, name_en, slug, logo_path, is_active, phone, email, manager_name_ar, manager_name_en, assistant_manager_ar, assistant_manager_en, assistant_manager_2_ar, assistant_manager_2_en, address_ar, address_en, updated_at";

const PUBLIC_SCHOOL_FIELDS =
  "id, name_ar, name_en, slug, logo_path, phone, email, manager_name_ar, manager_name_en, assistant_manager_ar, assistant_manager_en, assistant_manager_2_ar, assistant_manager_2_en, address_ar, address_en, academic_year";

type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function isAnonymous(client: ServerClient): Promise<boolean> {
  const authResult = await client?.auth?.getUser?.();
  return Boolean(authResult && !authResult.data.user);
}

async function getPublicSchool(
  client: ServerClient,
  schoolId?: string | null,
): Promise<SchoolRow | null> {
  const publicQuery = client.from("public_school_profiles").select(PUBLIC_SCHOOL_FIELDS);
  const { data, error } = schoolId
    ? await publicQuery.eq("id", schoolId).maybeSingle()
    : await publicQuery.limit(1).maybeSingle();

  if (error) {
    throw mapDatabaseError(error);
  }

  return data
    ? ({ ...data, is_active: true, timezone: process.env.SCHOOL_TIMEZONE || "Asia/Kuwait" } as SchoolRow)
    : null;
}

async function getAcademicYear(client: ServerClient): Promise<string | null> {
  const { data, error } = await client
    .from("school_settings")
    .select("academic_year")
    .eq("singleton", true)
    .maybeSingle();

  if (error) {
    throw mapDatabaseError(error);
  }
  return data?.academic_year ?? null;
}

export async function getCurrentSchool(schoolId?: string | null): Promise<SchoolRow | null> {
  const supabase = await createSupabaseServerClient();
  if (await isAnonymous(supabase)) return getPublicSchool(supabase, schoolId);

  let targetId = schoolId;

  if (targetId === undefined || targetId === "singleton") {
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

  const school = data
    ? ({ ...data, timezone: process.env.SCHOOL_TIMEZONE || "Asia/Kuwait" } as SchoolRow)
    : null;

  if (school) {
    const academicYear = await getAcademicYear(supabase);
    if (academicYear) {
      school.academic_year = academicYear;
    }
  }

  return school;
}
