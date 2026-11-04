import { assertCanViewReports } from "@/lib/reports/assertCanViewReports";
import { reportError } from "@/lib/logger/reportError";
import { getDashboardComplianceData } from "./getDashboardComplianceData";
import type { DashboardComplianceData } from "./types";

/**
 * Loads the dashboard compliance widget with the same authorization and
 * department scope the reports page uses, so the two surfaces cannot disagree
 * for the same user (K7). A failure is reported, not swallowed.
 */
export async function loadDashboardCompliance(): Promise<DashboardComplianceData | null> {
  const access = await assertCanViewReports();
  if (!access.authorized) {
    return null;
  }

  try {
    return await getDashboardComplianceData(access.schoolId, access.scopedDepartmentId);
  } catch (error) {
    await reportError(error, { scope: "dashboard.compliance" });
    return null;
  }
}
