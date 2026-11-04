import { describe, it, expect, vi } from "vitest";
import { applyMaintenanceReportFilters } from "./applyMaintenanceReportFilters";

function createMockQuery() {
  const query = {
    eq: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
  };
  query.eq.mockReturnValue(query);
  query.gte.mockReturnValue(query);
  query.lte.mockReturnValue(query);
  return query;
}

describe("applyMaintenanceReportFilters", () => {
  it("applies departmentId filter to reporter_department_id", () => {
    const query = createMockQuery();

    applyMaintenanceReportFilters(query, { departmentId: "dept-123" });

    expect(query.eq).toHaveBeenCalledWith("reporter_department_id", "dept-123");
  });

  it("applies status and category filters", () => {
    const query = createMockQuery();

    applyMaintenanceReportFilters(query, { status: "in_progress", category: "electrical" });

    expect(query.eq).toHaveBeenCalledWith("status", "in_progress");
    expect(query.eq).toHaveBeenCalledWith("category", "electrical");
  });

  it("applies date range filters", () => {
    const query = createMockQuery();

    applyMaintenanceReportFilters(query, { from: "2026-01-01", to: "2026-01-31" });

    expect(query.gte).toHaveBeenCalledWith("created_at", "2026-01-01");
    expect(query.lte).toHaveBeenCalledWith("created_at", "2026-01-31T23:59:59.999Z");
  });
});
