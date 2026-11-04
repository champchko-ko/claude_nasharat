import { createSupabaseServerClient } from "@/lib/supabase";
import { warnOnDataTruncation } from "@/lib/supabase/warnOnDataTruncation";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { getSchoolDepartments } from "@/lib/school/getSchoolDepartments";
import { fetchCircularReportBatches } from "./fetchCircularReportBatches";
import { calculateCompliance } from "./calculateCompliance";
import { isDeliveredStatus } from "./isDeliveredStatus";
import { applyCircularReportFilters } from "./applyCircularReportFilters";
import type { ReportFilterParams, CircularsReportSummaryData } from "./types";

interface RawCircularRow {
  id: string;
  ref_number: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  publish_at: string | null;
  due_at: string | null;
  created_at: string;
}

export async function getCircularsReportData(
  schoolId: string,
  filters: ReportFilterParams = {},
  scopedDepartmentId?: string | null,
): Promise<CircularsReportSummaryData> {
  const supabase = await createSupabaseServerClient();
  const effectiveDeptId = scopedDepartmentId || filters.departmentId;

  const baseQuery = supabase
    .from("circulars")
    .select("id, ref_number, title, category, priority, status, publish_at, due_at, created_at")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });

  const query = applyCircularReportFilters(baseQuery, filters);
  const { data: circulars, error: circularsError } = await query;

  if (circularsError) {
    throw mapDatabaseError(circularsError);
  }

  const fetched = (circulars ?? []) as RawCircularRow[];
  warnOnDataTruncation(fetched.length, "getCircularsReportData.circulars");

  // Drafts, archived and cancelled circulars are not obligations and are not
  // listed either (§4.2 of the inspection report).
  const circularList = fetched.filter((circular) => isDeliveredStatus(circular.status));
  const circularIds = circularList.map((circular) => circular.id);

  const departments = await getSchoolDepartments(schoolId);
  const { targets, responses } = await fetchCircularReportBatches(supabase, circularIds);

  const activeDepts = effectiveDeptId
    ? departments.filter((department) => department.id === effectiveDeptId)
    : departments;

  const compliance = calculateCompliance({
    circulars: circularList,
    targets,
    responses,
    departments: activeDepts,
  });

  return {
    totalCirculars: circularList.length,
    publishedCount: circularList.filter(
      (circular) => circular.status === "published" || circular.status === "in_progress",
    ).length,
    overdueCount: compliance.totals.overdue,
    totals: compliance.totals,
    departmentBreakdown: compliance.departments,
    rows: compliance.circulars,
  };
}
