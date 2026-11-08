import { describe, it, expect } from "vitest";
import { getCircularDepartmentStatuses } from "./getCircularDepartmentStatuses";
import type { CircularDetail } from "./getCircularById";
import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";
import type { CircularResponseRow } from "./types";

describe("getCircularDepartmentStatuses", () => {
  const depts: DepartmentRow[] = [
    {
      id: "d1",
      name_ar: "قسم العلوم",
      name_en: "Science Dept",
      is_active: true,
      created_at: "",
    },
    {
      id: "d2",
      name_ar: "قسم الرياضيات",
      name_en: "Math Dept",
      is_active: true,
      created_at: "",
    },
  ];

  const baseCircular: CircularDetail = {
    id: "c1",
    ref_number: "CIRC-001",
    title: "Test Circular",
    body: "Content",
    priority: "normal",
    status: "published",
    visibility: "internal",
    response_type: "acknowledgement",
    response_instructions: null,
    allow_response_revision: false,
    category: "administrative",
    created_by: "u1",
    publish_at: null,
    due_at: null,
    closed_at: null,
    created_at: "",
    targets: [],
    attachments: [],
  };

  it("targets all active departments when targets list is empty", () => {
    const statuses = getCircularDepartmentStatuses(baseCircular, depts, []);
    expect(statuses).toHaveLength(2);
    expect(statuses[0]?.hasResponded).toBe(false);
    expect(statuses[1]?.hasResponded).toBe(false);
  });

  it("correctly identifies responded and not responded departments", () => {
    const response: CircularResponseRow = {
      id: "r1",
      circular_id: "c1",
      department_id: "d1",
      department_name: "قسم العلوم",
      responder_id: "u2",
      responder_name: "أحمد",
      response_type: "acknowledgement",
      status: "acknowledged",
      reason: null,
      is_latest: true,
      submitted_at: "2026-10-24T10:00:00Z",
    };

    const statuses = getCircularDepartmentStatuses(baseCircular, depts, [response]);
    const d1Status = statuses.find((s) => s.departmentId === "d1");
    const d2Status = statuses.find((s) => s.departmentId === "d2");

    expect(d1Status?.hasResponded).toBe(true);
    expect(d1Status?.response?.responder_name).toBe("أحمد");
    expect(d2Status?.hasResponded).toBe(false);
    expect(d2Status?.response).toBeUndefined();
  });

  it("filters to specific targeted departments when specified", () => {
    const targetedCircular: CircularDetail = {
      ...baseCircular,
      targets: [
        {
          id: "t1",
          circular_id: "c1",
          department_id: "d2",
          department_name: "قسم الرياضيات",
          role_key: null,
        },
      ],
    };

    const statuses = getCircularDepartmentStatuses(targetedCircular, depts, []);
    expect(statuses).toHaveLength(1);
    expect(statuses[0]?.departmentId).toBe("d2");
  });
});
