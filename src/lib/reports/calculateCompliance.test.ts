import { describe, it, expect } from "vitest";
import { calculateCompliance } from "./calculateCompliance";
import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";

function department(id: string, name: string, isActive = true): DepartmentRow {
  return {
    id,
    name_ar: name,
    name_en: name,
    is_active: isActive,
    created_at: "",
  };
}

function circular(id: string, status: string, dueAt: string | null = null) {
  return {
    id,
    ref_number: `REF-${id}`,
    title: `Circular ${id}`,
    category: "general",
    priority: "normal",
    status,
    publish_at: "2026-01-01T00:00:00Z",
    due_at: dueAt,
  };
}

const departments = [
  department("A", "Science"),
  department("B", "Math"),
  department("C", "Arabic"),
  department("D", "Inactive", false),
];

/**
 * The scenario from School_Admin_Portal_Inspection_Report.md §4.2:
 * C1 published (all departments), C2 draft, C3 published (A and B), C4 cancelled.
 * A approved C1, B acknowledged C1; A approved C3, B rejected C3.
 */
const scenario = {
  circulars: [
    circular("C1", "published"),
    circular("C2", "draft"),
    circular("C3", "published"),
    circular("C4", "cancelled"),
  ],
  targets: [
    { circular_id: "C3", department_id: "A" },
    { circular_id: "C3", department_id: "B" },
  ],
  responses: [
    { circular_id: "C1", department_id: "A", status: "approved" },
    { circular_id: "C1", department_id: "B", status: "acknowledged" },
    { circular_id: "C3", department_id: "A", status: "approved" },
    { circular_id: "C3", department_id: "B", status: "rejected" },
  ],
};

describe("calculateCompliance", () => {
  it("reproduces the inspection report's §4.2 scenario", () => {
    const result = calculateCompliance({ ...scenario, departments });

    expect(result.totals.targeted).toBe(5);
    expect(result.totals.compliant).toBe(3);
    expect(result.totals.percent).toBe(60);

    const byId = Object.fromEntries(result.departments.map((d) => [d.departmentId, d]));
    expect(byId.A).toMatchObject({ targeted: 2, compliant: 2, percent: 100 });
    expect(byId.B).toMatchObject({ targeted: 2, compliant: 1, percent: 50 });
    expect(byId.C).toMatchObject({ targeted: 1, compliant: 0, percent: 0 });
    // Inactive departments are never targeted by a broadcast circular.
    expect(byId.D).toMatchObject({ targeted: 0, percent: null });

    const circularRows = Object.fromEntries(result.circulars.map((c) => [c.id, c]));
    expect(circularRows.C1).toMatchObject({ targeted: 3, compliant: 2, percent: 67 });
    expect(circularRows.C3).toMatchObject({ targeted: 2, compliant: 1, percent: 50 });
    // Draft and cancelled circulars are neither computed nor listed.
    expect(circularRows.C2).toBeUndefined();
    expect(circularRows.C4).toBeUndefined();
  });

  it("removes not_applicable targets from the denominator", () => {
    const result = calculateCompliance({
      circulars: [circular("C1", "published")],
      targets: [
        { circular_id: "C1", department_id: "A" },
        { circular_id: "C1", department_id: "B" },
      ],
      responses: [
        { circular_id: "C1", department_id: "A", status: "not_applicable" },
        { circular_id: "C1", department_id: "B", status: "acknowledged" },
      ],
      departments,
    });

    expect(result.totals).toMatchObject({
      targeted: 1,
      compliant: 1,
      notApplicable: 1,
      percent: 100,
    });
    expect(result.circulars[0]).toMatchObject({ targeted: 1, compliant: 1, percent: 100 });
  });

  it("splits outstanding work into overdue and not yet due by due date", () => {
    const now = new Date("2026-06-01T00:00:00Z");
    const result = calculateCompliance({
      circulars: [
        circular("LATE", "published", "2026-05-01T00:00:00Z"),
        circular("SOON", "published", "2026-07-01T00:00:00Z"),
      ],
      targets: [
        { circular_id: "LATE", department_id: "A" },
        { circular_id: "SOON", department_id: "A" },
      ],
      responses: [],
      departments,
      now,
    });

    expect(result.totals).toMatchObject({ targeted: 2, overdue: 1, notYetDue: 1, percent: 0 });
    const late = result.circulars.find((c) => c.id === "LATE")!;
    expect(late.overdue).toBe(1);
    expect(late.notYetDue).toBe(0);
  });

  it("ignores a response from a department the circular did not target", () => {
    const result = calculateCompliance({
      circulars: [circular("C1", "published")],
      targets: [{ circular_id: "C1", department_id: "A" }],
      responses: [{ circular_id: "C1", department_id: "C", status: "acknowledged" }],
      departments,
    });

    expect(result.totals).toMatchObject({ targeted: 1, compliant: 0, percent: 0 });
    expect(result.circulars[0]!.pendingDepartments.map((d) => d.id)).toEqual(["A"]);
  });

  it("reports null percent when there is nothing to respond to", () => {
    const result = calculateCompliance({
      circulars: [],
      targets: [],
      responses: [],
      departments,
    });

    expect(result.totals).toMatchObject({ targeted: 0, percent: null });
    expect(result.departments.every((d) => d.percent === null)).toBe(true);
  });
});
