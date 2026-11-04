import { describe, it, expect } from "vitest";
import { sumComplianceCounts } from "./sumComplianceCounts";
import type { DashboardDepartmentComplianceSlice } from "./types";

function slice(
  id: string,
  targeted: number,
  compliant: number,
  overdue = 0,
  notYetDue = 0,
): DashboardDepartmentComplianceSlice {
  return {
    id,
    name: id,
    targeted,
    compliant,
    overdue,
    notYetDue,
    percent: targeted > 0 ? Math.round((compliant / targeted) * 100) : null,
  };
}

describe("sumComplianceCounts", () => {
  it("derives the headline from the same slices the chart draws", () => {
    const counts = sumComplianceCounts([slice("d1", 2, 2), slice("d2", 2, 1, 1)]);

    expect(counts.targeted).toBe(4);
    expect(counts.compliant).toBe(3);
    expect(counts.overdue).toBe(1);
    expect(counts.notYetDue).toBe(0);
    expect(counts.percent).toBe(75);
  });

  it("reports no rate when nothing is targeted", () => {
    const counts = sumComplianceCounts([slice("d1", 0, 0), slice("d2", 0, 0)]);

    expect(counts.targeted).toBe(0);
    expect(counts.percent).toBeNull();
  });

  it("keeps the three outstanding buckets separate", () => {
    const counts = sumComplianceCounts([slice("d1", 3, 1, 1, 1)]);

    expect(counts).toMatchObject({ targeted: 3, compliant: 1, overdue: 1, notYetDue: 1 });
    expect((counts.compliant ?? 0) + counts.overdue + counts.notYetDue).toBe(counts.targeted);
  });

  it("returns a zeroed result for an empty scope", () => {
    expect(sumComplianceCounts([])).toEqual({
      targeted: 0,
      compliant: 0,
      overdue: 0,
      notYetDue: 0,
      notApplicable: 0,
      percent: null,
    });
  });
});
