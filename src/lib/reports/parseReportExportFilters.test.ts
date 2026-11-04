import { describe, it, expect } from "vitest";
import { parseReportExportFilters } from "./parseReportExportFilters";

describe("parseReportExportFilters", () => {
  it("prefers scopedDepartmentId when provided", () => {
    const params = new URLSearchParams("departmentId=foreign-dept&status=open");
    const result = parseReportExportFilters(params, "scoped-dept");

    expect(result.departmentId).toBe("scoped-dept");
    expect(result.status).toBe("open");
  });

  it("falls back to searchParams departmentId when scopedDepartmentId is null/undefined", () => {
    const params = new URLSearchParams("departmentId=dept-123&from=2026-01-01");
    const result = parseReportExportFilters(params, null);

    expect(result.departmentId).toBe("dept-123");
    expect(result.from).toBe("2026-01-01");
  });
});
