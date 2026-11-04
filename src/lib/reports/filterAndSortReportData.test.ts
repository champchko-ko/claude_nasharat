import { describe, it, expect } from "vitest";
import { filterAndSortReportData } from "./filterAndSortReportData";
import type {
  CircularsReportSummaryData,
  MaintenanceReportSummaryData,
  ReportFilterState,
} from "./types";

describe("filterAndSortReportData", () => {
  const dummyCirculars: CircularsReportSummaryData = {
    totalCirculars: 2,
    publishedCount: 2,
    overdueCount: 0,
    totals: {
      targeted: 2,
      compliant: 1,
      overdue: 0,
      notYetDue: 1,
      notApplicable: 0,
      percent: 50,
    },
    departmentBreakdown: [
      {
        departmentId: "d1",
        departmentName: "Science",
        targeted: 1,
        compliant: 1,
        overdue: 0,
        notYetDue: 0,
        notApplicable: 0,
        percent: 100,
      },
      {
        departmentId: "d2",
        departmentName: "Math",
        targeted: 1,
        compliant: 0,
        overdue: 0,
        notYetDue: 1,
        notApplicable: 0,
        percent: 0,
      },
    ],
    rows: [
      {
        id: "c1",
        refNumber: "CIRC-01",
        title: "Staff Meeting",
        category: "administrative",
        priority: "medium",
        status: "published",
        publishAt: "2026-10-10T10:00:00Z",
        dueAt: "2026-10-20T10:00:00Z",
        targeted: 1,
        compliant: 1,
        overdue: 0,
        notYetDue: 0,
        notApplicable: 0,
        percent: 100,
        respondedDepartments: [{ id: "d1", name: "Science", outstanding: 0 }],
        pendingDepartments: [],
      },
      {
        id: "c2",
        refNumber: "CIRC-02",
        title: "Curriculum Update",
        category: "academic",
        priority: "high",
        status: "published",
        publishAt: "2026-09-15T09:00:00Z",
        dueAt: "2026-09-25T09:00:00Z",
        targeted: 1,
        compliant: 0,
        overdue: 0,
        notYetDue: 1,
        notApplicable: 0,
        percent: 0,
        respondedDepartments: [],
        pendingDepartments: [{ id: "d2", name: "Math", outstanding: 1 }],
      },
    ],
  };

  const dummyMaintenance: MaintenanceReportSummaryData = {
    totalTickets: 2,
    openCount: 1,
    resolvedCount: 1,
    avgResolutionTimeHours: 12,
    priorityBreakdown: { high: 1, low: 1 },
    statusBreakdown: { in_progress: 1, resolved: 1 },
    rows: [
      {
        id: "m1",
        ticketNumber: "T-100",
        title: "AC Leaking",
        category: "electrical",
        priority: "high",
        status: "in_progress",
        locationName: "Room 101",
        reporterName: "Alice",
        departmentId: "d1",
        departmentName: "Science",
        operatorName: null,
        createdAt: "2026-10-05T08:00:00Z",
        resolvedAt: null,
        resolutionTimeHours: null,
      },
      {
        id: "m2",
        ticketNumber: "T-101",
        title: "Broken Door",
        category: "carpentry",
        priority: "low",
        status: "resolved",
        locationName: "Room 202",
        reporterName: "Bob",
        departmentId: "d2",
        departmentName: "Math",
        operatorName: "Tech 1",
        createdAt: "2026-09-02T11:00:00Z",
        resolvedAt: "2026-09-02T23:00:00Z",
        resolutionTimeHours: 12,
      },
    ],
  };

  const defaultFilters: ReportFilterState = {
    dateMode: "all",
    month: "",
    fromDate: "",
    toDate: "",
    dateSort: "desc",
    departmentId: "all",
    departmentSort: "none",
  };

  it("returns all data when default filters are active", () => {
    const res = filterAndSortReportData(dummyCirculars, dummyMaintenance, defaultFilters);
    expect(res.filteredCircularsData.rows).toHaveLength(2);
    expect(res.filteredMaintenanceData.rows).toHaveLength(2);
  });

  it("filters circulars and maintenance by month", () => {
    const res = filterAndSortReportData(dummyCirculars, dummyMaintenance, {
      ...defaultFilters,
      dateMode: "month",
      month: "2026-10",
    });
    expect(res.filteredCircularsData.rows).toHaveLength(1);
    expect(res.filteredCircularsData.rows[0].id).toBe("c1");
    expect(res.filteredMaintenanceData.rows).toHaveLength(1);
    expect(res.filteredMaintenanceData.rows[0].id).toBe("m1");
  });

  it("filters by custom date range", () => {
    const res = filterAndSortReportData(dummyCirculars, dummyMaintenance, {
      ...defaultFilters,
      dateMode: "custom",
      fromDate: "2026-09-01",
      toDate: "2026-09-30",
    });
    expect(res.filteredCircularsData.rows).toHaveLength(1);
    expect(res.filteredCircularsData.rows[0].id).toBe("c2");
    expect(res.filteredMaintenanceData.rows).toHaveLength(1);
    expect(res.filteredMaintenanceData.rows[0].id).toBe("m2");
  });

  it("filters by department", () => {
    const res = filterAndSortReportData(dummyCirculars, dummyMaintenance, {
      ...defaultFilters,
      departmentId: "d1",
    });
    expect(res.filteredCircularsData.rows).toHaveLength(1);
    expect(res.filteredCircularsData.rows[0].id).toBe("c1");
    expect(res.filteredCircularsData.departmentBreakdown).toHaveLength(1);
    expect(res.filteredCircularsData.departmentBreakdown[0].departmentId).toBe("d1");
    expect(res.filteredMaintenanceData.rows).toHaveLength(1);
    expect(res.filteredMaintenanceData.rows[0].id).toBe("m1");
  });

  it("sorts by date ascending and descending", () => {
    const asc = filterAndSortReportData(dummyCirculars, dummyMaintenance, {
      ...defaultFilters,
      dateSort: "asc",
    });
    expect(asc.filteredCircularsData.rows[0].id).toBe("c2"); // Sep before Oct
    expect(asc.filteredMaintenanceData.rows[0].id).toBe("m2"); // Sep before Oct

    const desc = filterAndSortReportData(dummyCirculars, dummyMaintenance, {
      ...defaultFilters,
      dateSort: "desc",
    });
    expect(desc.filteredCircularsData.rows[0].id).toBe("c1"); // Oct before Sep
    expect(desc.filteredMaintenanceData.rows[0].id).toBe("m1"); // Oct before Sep
  });

  it("sorts by department name", () => {
    const deptAsc = filterAndSortReportData(dummyCirculars, dummyMaintenance, {
      ...defaultFilters,
      departmentSort: "asc",
    });
    expect(deptAsc.filteredCircularsData.departmentBreakdown[0].departmentName).toBe("Math");
    expect(deptAsc.filteredMaintenanceData.rows[0].departmentName).toBe("Math");

    const deptDesc = filterAndSortReportData(dummyCirculars, dummyMaintenance, {
      ...defaultFilters,
      departmentSort: "desc",
    });
    expect(deptDesc.filteredCircularsData.departmentBreakdown[0].departmentName).toBe("Science");
    expect(deptDesc.filteredMaintenanceData.rows[0].departmentName).toBe("Science");
  });
});
