import type { SupabaseClient } from "@supabase/supabase-js";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";

export async function getDepartmentMemberUserIds(
  supabase: SupabaseClient,
  schoolId: string,
  departmentIds: string[],
): Promise<string[]> {
  void schoolId;
  if (!departmentIds.length) return [];

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_active", true)
    .in("department_id", departmentIds);

  if (error) {
    throw mapDatabaseError(error);
  }

  return (users ?? []).map((u) => u.id as string);
}
