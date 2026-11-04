import { describe, it, expect } from "vitest";
import { buildReportExportParams } from "./buildReportExportParams";

describe("buildReportExportParams", () => {
  it("builds base params with type", () => {
    const params = buildReportExportParams("circulars");
    expect(params.get("type")).toBe("circulars");
    expect(params.has("departmentId")).toBe(false);
  });

  it("applies department filter when not 'all'", () => {
    const params = buildReportExportParams("maintenance", {
      departmentId: "dep-1",
    });
    expect(params.get("type")).toBe("maintenance");
    expect(params.get("departmentId")).toBe("dep-1");
  });

  it("applies month range when dateMode is 'month'", () => {
    const params = buildReportExportParams("circulars", {
      dateMode: "month",
      month: "2026-02",
    });
    expect(params.get("from")).toBe("2026-02-01");
    expect(params.get("to")).toBe("2026-02-28");
  });

  it("applies custom date range when dateMode is 'custom'", () => {
    const params = buildReportExportParams("circulars", {
      dateMode: "custom",
      fromDate: "2026-10-05",
      toDate: "2026-10-25",
    });
    expect(params.get("from")).toBe("2026-10-05");
    expect(params.get("to")).toBe("2026-10-25");
  });
});
