import { createSupabaseServerClient } from "@/lib/supabase";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { toProfileRow, type RawProfileResult } from "./toProfileRow";

export type ProfileRow = {
  id: string;
  full_name: string;
  email: string | null;
  job_title: string | null;
  school_id: string | null;
  department_id: string | null;
  department_name_ar?: string | null;
  department_name_en?: string | null;
  department_name?: string | null;
  is_active: boolean;
};

export async function getCurrentProfile(): Promise<ProfileRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, job_title, school_id, department_id, is_active, departments!profiles_department_id_fkey(id, name_ar, name_en)",
    )
    .eq("id", userData.user.id)
    .maybeSingle();

  if (error) {
    throw mapDatabaseError(error);
  }

  if (!data) return null;
  return toProfileRow(data as unknown as RawProfileResult);
}
