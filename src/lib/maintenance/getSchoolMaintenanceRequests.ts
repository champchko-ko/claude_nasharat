import { createSupabaseServerClient } from "@/lib/supabase";
import { warnOnDataTruncation } from "@/lib/supabase/warnOnDataTruncation";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import type { MaintenanceRequestRow } from "./types";

export async function getSchoolMaintenanceRequests(
  schoolId?: string | null,
): Promise<MaintenanceRequestRow[]> {
  if (!schoolId) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("maintenance_requests")
    .select(
      `
      id, school_id, ticket_number, title, description, category,
      location_id, area, asset_ref, priority, status,
      reporter_id, assigned_operator_id,
      first_response_at, resolved_at, closed_at, created_at, updated_at,
      location:locations(id, building, floor, room),
      department:departments!maintenance_requests_reporter_department_id_fkey(id, name_ar, name_en),
      reporter:profiles!maintenance_requests_reporter_id_fkey(id, full_name, email),
      assigned_operator:profiles!maintenance_requests_assigned_operator_id_fkey(id, full_name, email)
    `,
    )
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });

  if (error) {
    throw mapDatabaseError(error);
  }

  const result = (data as unknown as MaintenanceRequestRow[]) ?? [];
  warnOnDataTruncation(result.length, "getSchoolMaintenanceRequests");
  return result;
}
