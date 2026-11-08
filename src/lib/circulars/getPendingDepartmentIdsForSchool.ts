import type { SupabaseClient } from "@supabase/supabase-js";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { getSchoolDepartments } from "@/lib/school/getSchoolDepartments";
import {
  calculateCompliance,
  type ComplianceCircularInput,
} from "@/lib/reports/calculateCompliance";
import { isDeliveredStatus } from "@/lib/reports/isDeliveredStatus";

const CIRCULAR_COLUMNS = "id, ref_number, title, category, priority, status, publish_at, due_at";

/**
 * Departments that still owe at least one response, across every circular that
 * creates an obligation.
 *
 * Reuses the shared calculation, so the reminder set and the dashboard badges
 * are the same numbers — including the "no target rows means every active
 * department" rule and `not_applicable` removals.
 */
export async function getPendingDepartmentIdsForSchool(
  supabase: SupabaseClient,
  schoolId: string,
): Promise<string[]> {
  void schoolId;
  const [{ data: circulars, error: circularsError }, departments] = await Promise.all([
    supabase.from("circulars").select(CIRCULAR_COLUMNS),
    getSchoolDepartments(),
  ]);

  if (circularsError) {
    throw mapDatabaseError(circularsError);
  }

  const delivered = (circulars ?? []).filter((circular) =>
    isDeliveredStatus(circular.status as string),
  );
  if (delivered.length === 0 || departments.length === 0) {
    return [];
  }

  const circularIds = delivered.map((circular) => circular.id as string);
  const [{ data: targets, error: targetsError }, { data: responses, error: responsesError }] =
    await Promise.all([
      supabase
        .from("circular_targets")
        .select("circular_id, department_id")
        .in("circular_id", circularIds),
      supabase
        .from("circular_responses")
        .select("circular_id, department_id, status")
        .eq("is_latest", true)
        .in("circular_id", circularIds),
    ]);

  if (targetsError) {
    throw mapDatabaseError(targetsError);
  }
  if (responsesError) {
    throw mapDatabaseError(responsesError);
  }

  const compliance = calculateCompliance({
    circulars: delivered as unknown as ComplianceCircularInput[],
    targets: (targets ?? []) as Array<{ circular_id: string; department_id: string | null }>,
    responses: (responses ?? []) as Array<{
      circular_id: string;
      department_id: string;
      status: string;
    }>,
    departments,
  });

  return compliance.departments
    .filter((item) => item.overdue + item.notYetDue > 0)
    .map((item) => item.departmentId);
}
