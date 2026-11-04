import type { ComplianceCounts } from "@/lib/reports/types";

export interface DashboardComplianceDeptBadge {
  id: string;
  name: string;
  /** Outstanding targets for the department in the current scope. */
  outstanding: number;
}

export interface DashboardDepartmentComplianceSlice {
  id: string;
  name: string;
  targeted: number;
  compliant: number;
  overdue: number;
  notYetDue: number;
  /** null when the department has nothing to respond to. */
  percent: number | null;
}

export interface DashboardComplianceCircularItem {
  id: string;
  refNumber: string;
  title: string;
  status: string;
  dueAt: string | null;
  targeted: number;
  compliant: number;
  overdue: number;
  notYetDue: number;
  notApplicable: number;
  percent: number | null;
  respondedDepartments: DashboardComplianceDeptBadge[];
  pendingDepartments: DashboardComplianceDeptBadge[];
}

export interface DashboardComplianceData {
  totals: ComplianceCounts;
  departmentSlices: DashboardDepartmentComplianceSlice[];
  /** The most relevant circulars, capped for the selector. */
  circulars: DashboardComplianceCircularItem[];
  /** Total delivered circulars with at least one target. */
  circularCount: number;
}
