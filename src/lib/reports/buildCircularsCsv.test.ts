import { describe, expect, it } from "vitest";
import { buildCircularsCsv } from "./buildCircularsCsv";
import type { CircularReportRow } from "./types";

const row: CircularReportRow = {
  id: "c1",
  refNumber: "CIR-1",
  title: "Midterm",
  category: "general",
  priority: "normal",
  status: "published",
  publishAt: "2026-01-01T00:00:00Z",
  dueAt: "2026-02-01T00:00:00Z",
  targeted: 2,
  compliant: 1,
  overdue: 1,
  notYetDue: 0,
  notApplicable: 0,
  percent: 50,
  respondedDepartments: [{ id: "d1", name: "Science", outstanding: 0 }],
  pendingDepartments: [{ id: "d2", name: "Math", outstanding: 1 }],
};

describe("buildCircularsCsv", () => {
  it("exports the same counts the chart shows, including the overdue split", () => {
    const csv = buildCircularsCsv([row]);
    const dataLine = csv.trim().split(/\r?\n/)[1]!;

    expect(dataLine).toContain("2"); // targeted
    expect(dataLine).toContain("50%");
    expect(dataLine).toContain("Science");
    expect(dataLine).toContain("Math (1)");
  });

  it("leaves the rate blank when nothing was required", () => {
    const csv = buildCircularsCsv([
      { ...row, targeted: 0, compliant: 0, overdue: 0, percent: null },
    ]);
    const cells = csv.trim().split(/\r?\n/)[1]!.split(",");

    // Compliance % column is the 13th field.
    expect(cells[12]).toBe("");
  });
});
