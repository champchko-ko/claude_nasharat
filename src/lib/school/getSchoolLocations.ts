import { createSupabaseServerClient } from "@/lib/supabase";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";

export type LocationRow = {
  id: string;
  building: string;
  floor: string | null;
  room: string | null;
  kind: string;
  is_active: boolean;
  created_at: string;
};

export async function getSchoolLocations(schoolId?: string | null): Promise<LocationRow[]> {
  void schoolId;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("locations")
    .select("id, building, floor, room, kind, is_active, created_at")
    .order("building", { ascending: true })
    .order("room", { ascending: true });

  if (error) {
    throw mapDatabaseError(error);
  }

  return (data as LocationRow[]) ?? [];
}
