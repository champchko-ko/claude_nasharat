import { describe, it, expect } from "vitest";
import { resolveReportExportDateBounds } from "./resolveReportExportDateBounds";

describe("resolveReportExportDateBounds", () => {
  it("resolves month bounds correctly", () => {
    const bounds = resolveReportExportDateBounds({
      dateMode: "month",
      month: "2026-02",
    });
    expect(bounds.from).toBe("2026-02-01");
    expect(bounds.to).toBe("2026-02-28");
  });

  it("resolves custom range correctly", () => {
    const bounds = resolveReportExportDateBounds({
      dateMode: "custom",
      fromDate: "2026-10-01",
      toDate: "2026-10-31",
    });
    expect(bounds.from).toBe("2026-10-01");
    expect(bounds.to).toBe("2026-10-31");
  });

  it("returns empty bounds when undefined or no range mode", () => {
    expect(resolveReportExportDateBounds()).toEqual({});
    expect(resolveReportExportDateBounds({ dateMode: "all" })).toEqual({});
  });
});
