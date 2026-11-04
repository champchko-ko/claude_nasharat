export interface ReportFilterParams {
  from?: string;
  to?: string;
  departmentId?: string;
  status?: string;
  category?: string;
}

/** Counts for one scope (school, department or circular). */
export interface ComplianceCounts {
  /** Denominator: targeted pairs minus `not_applicable` ones. */
  targeted: number;
  compliant: number;
  overdue: number;
  notYetDue: number;
  /** Targets removed from the denominator because the answer was not applicable. */
  notApplicable: number;
  /** null when `targeted` is 0 — never a fabricated 100%. */
  percent: number | null;
}

export interface ComplianceDepartmentRef {
  id: string;
  name: string;
  /** Outstanding targets for this department in this circular. */
  outstanding: number;
}

export interface DepartmentComplianceItem extends ComplianceCounts {
  departmentId: string;
  departmentName: string;
}

export interface CircularReportRow extends ComplianceCounts {
  id: string;
  refNumber: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  publishAt: string | null;
  dueAt: string | null;
  respondedDepartments: ComplianceDepartmentRef[];
  pendingDepartments: ComplianceDepartmentRef[];
}

export interface CircularsReportSummaryData {
  totalCirculars: number;
  publishedCount: number;
  /** Targets past their due date and still outstanding. */
  overdueCount: number;
  totals: ComplianceCounts;
  departmentBreakdown: DepartmentComplianceItem[];
  rows: CircularReportRow[];
}

export interface DepartmentCompactItem {
  id: string;
  name: string;
}

export interface MaintenanceReportRow {
  id: string;
  ticketNumber: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  locationName: string;
  reporterName: string;
  departmentId?: string | null;
  departmentName?: string | null;
  operatorName: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolutionTimeHours: number | null;
}

export interface MaintenanceReportSummaryData {
  totalTickets: number;
  openCount: number;
  resolvedCount: number;
  avgResolutionTimeHours: number | null;
  priorityBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  rows: MaintenanceReportRow[];
}

export type ReportDateMode = "all" | "month" | "custom";
export type SortDirection = "asc" | "desc" | "none";

export interface ReportFilterState {
  dateMode: ReportDateMode;
  month: string;
  fromDate: string;
  toDate: string;
  dateSort: SortDirection;
  departmentId: string;
  departmentSort: SortDirection;
}
