import { getCircularsReportData } from "@/lib/reports/getCircularsReportData";
import type {
  DashboardComplianceCircularItem,
  DashboardComplianceData,
  DashboardDepartmentComplianceSlice,
} from "./types";
import { compareCircularRelevance } from "./compareCircularRelevance";

/** How many circulars the widget offers in its selector; the rest are in Reports. */
const DASHBOARD_CIRCULAR_LIMIT = 10;

export async function getDashboardComplianceData(
  schoolId: string,
  scopedDepartmentId?: string | null,
): Promise<DashboardComplianceData> {
  const reportData = await getCircularsReportData(schoolId, {}, scopedDepartmentId);

  const departmentSlices: DashboardDepartmentComplianceSlice[] = reportData.departmentBreakdown.map(
    (department) => ({
      id: department.departmentId,
      name: department.departmentName,
      targeted: department.targeted,
      compliant: department.compliant,
      overdue: department.overdue,
      notYetDue: department.notYetDue,
      percent: department.percent,
    }),
  );

  const selectableCirculars = reportData.rows
    .filter((row) => row.targeted > 0)
    .sort(compareCircularRelevance);

  const circulars: DashboardComplianceCircularItem[] = selectableCirculars
    .slice(0, DASHBOARD_CIRCULAR_LIMIT)
    .map((row) => ({
      id: row.id,
      refNumber: row.refNumber,
      title: row.title,
      status: row.status,
      dueAt: row.dueAt,
      targeted: row.targeted,
      compliant: row.compliant,
      overdue: row.overdue,
      notYetDue: row.notYetDue,
      notApplicable: row.notApplicable,
      percent: row.percent,
      respondedDepartments: row.respondedDepartments,
      pendingDepartments: row.pendingDepartments,
    }));

  return {
    totals: reportData.totals,
    departmentSlices,
    circulars,
    circularCount: selectableCirculars.length,
  };
}
