import { createSupabaseServerClient } from "@/lib/supabase";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";

export type LocationRow = {
  id: string;
  school_id: string;
  building: string;
  floor: string | null;
  room: string | null;
  kind: string;
  is_active: boolean;
  created_at: string;
};

export async function getSchoolLocations(schoolId?: string | null): Promise<LocationRow[]> {
  const supabase = await createSupabaseServerClient();
  let resolvedId = schoolId;
  if (!resolvedId) {
    const { data: firstSchool, error: firstSchoolError } = await supabase
      .from("schools")
      .select("id")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (firstSchoolError) {
      throw mapDatabaseError(firstSchoolError);
    }

    resolvedId = firstSchool?.id ?? null;
  }
  if (!resolvedId) return [];

  const { data, error } = await supabase
    .from("locations")
    .select("id, school_id, building, floor, room, kind, is_active, created_at")
    .eq("school_id", resolvedId)
    .order("building", { ascending: true })
    .order("room", { ascending: true });

  if (error) {
    throw mapDatabaseError(error);
  }

  return (data as LocationRow[]) ?? [];
}
