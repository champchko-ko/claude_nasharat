import { describe, it, expect } from "vitest";
import { sortDepartmentSlices } from "./sortDepartmentSlices";
import type { DashboardDepartmentComplianceSlice } from "./types";

function slice(
  id: string,
  percent: number | null,
  overdue = 0,
): DashboardDepartmentComplianceSlice {
  return {
    id,
    name: id,
    targeted: 1,
    compliant: percent === null ? 0 : Math.round(percent / 100),
    overdue,
    notYetDue: percent === null ? 0 : 1,
    percent,
  };
}

describe("sortDepartmentSlices", () => {
  it("puts the lowest compliance rate first", () => {
    const sorted = sortDepartmentSlices([
      slice("alpha", 100),
      slice("beta", 25),
      slice("gamma", 50),
    ]);

    expect(sorted.map((s) => s.id)).toEqual(["beta", "gamma", "alpha"]);
  });

  it("breaks a rate tie with the department that has more overdue work", () => {
    const sorted = sortDepartmentSlices([slice("alpha", 60, 1), slice("beta", 60, 4)]);

    expect(sorted.map((s) => s.id)).toEqual(["beta", "alpha"]);
  });

  it("sorts departments with no rate last, never at the top", () => {
    const sorted = sortDepartmentSlices([slice("none", null), slice("zero", 0)]);

    expect(sorted.map((s) => s.id)).toEqual(["zero", "none"]);
  });

  it("does not mutate the input array", () => {
    const input = [slice("alpha", 100), slice("beta", 30)];
    const sorted = sortDepartmentSlices(input);

    expect(input.map((s) => s.id)).toEqual(["alpha", "beta"]);
    expect(sorted.map((s) => s.id)).toEqual(["beta", "alpha"]);
  });
});
