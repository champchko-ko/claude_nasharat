import type { SupabaseClient } from "@supabase/supabase-js";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { getSchoolDepartments } from "@/lib/school/getSchoolDepartments";
import {
  calculateCompliance,
  type ComplianceCircularInput,
} from "@/lib/reports/calculateCompliance";
import { isRemindableStatus } from "./isRemindableStatus";

const CIRCULAR_COLUMNS =
  "id, ref_number, title, category, priority, status, publish_at, due_at";

/**
 * Departments that still owe a response on one circular.
 *
 * Uses the shared calculation rather than the raw target rows, so a circular
 * with no target rows (which targets every active department) produces the same
 * pending set the dashboard shows, and `not_applicable` answers are excluded.
 */
export async function getPendingCircularDepartmentIds(
  supabase: SupabaseClient,
  circularId: string,
): Promise<string[]> {
  const { data: circular, error: circularError } = await supabase
    .from("circulars")
    .select(CIRCULAR_COLUMNS)
    .eq("id", circularId)
    .maybeSingle();

  if (circularError) {
    throw mapDatabaseError(circularError);
  }
  if (!circular || !isRemindableStatus(circular.status as string)) {
    return [];
  }

  const departments = await getSchoolDepartments();
  const [{ data: targets, error: targetsError }, { data: responses, error: responsesError }] =
    await Promise.all([
      supabase
        .from("circular_targets")
        .select("circular_id, department_id")
        .eq("circular_id", circularId),
      supabase
        .from("circular_responses")
        .select("circular_id, department_id, status")
        .eq("circular_id", circularId)
        .eq("is_latest", true),
    ]);

  if (targetsError) {
    throw mapDatabaseError(targetsError);
  }
  if (responsesError) {
    throw mapDatabaseError(responsesError);
  }

  const compliance = calculateCompliance({
    circulars: [circular as unknown as ComplianceCircularInput],
    targets: (targets ?? []) as Array<{ circular_id: string; department_id: string | null }>,
    responses: (responses ?? []) as Array<{
      circular_id: string;
      department_id: string;
      status: string;
    }>,
    departments,
  });

  return compliance.circulars[0]?.pendingDepartments.map((department) => department.id) ?? [];
}
