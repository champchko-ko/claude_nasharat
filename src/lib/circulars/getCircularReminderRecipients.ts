import type { SupabaseClient } from "@supabase/supabase-js";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { getDepartmentMemberUserIds } from "./getDepartmentMemberUserIds";
import { getPendingCircularDepartmentIds } from "./getPendingCircularDepartmentIds";
import { getPendingDepartmentIdsForSchool } from "./getPendingDepartmentIdsForSchool";

export async function getCircularReminderRecipients({
  supabase,
  schoolId,
  circularId,
  targetType,
  customUserIds = [],
}: {
  supabase: SupabaseClient;
  schoolId: string;
  circularId?: string | null;
  targetType: "pending" | "all" | "custom";
  customUserIds?: string[];
}): Promise<string[]> {
  if (targetType === "custom") {
    return customUserIds.filter(Boolean);
  }

  if (targetType === "all") {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("school_id", schoolId)
      .eq("is_active", true);

    if (error) {
      throw mapDatabaseError(error);
    }

    return (data ?? []).map((p) => p.id as string);
  }

  if (circularId) {
    const pendingDeptIds = await getPendingCircularDepartmentIds(supabase, circularId);
    return getDepartmentMemberUserIds(supabase, schoolId, pendingDeptIds);
  }

  // "Pending" without a specific circular means every department that still
  // owes a response somewhere in the school, not every targeted department.
  const pendingDeptIds = await getPendingDepartmentIdsForSchool(supabase, schoolId);
  return getDepartmentMemberUserIds(supabase, schoolId, pendingDeptIds);
}
