import { describe, expect, it } from "vitest";
import { mapSchoolUserRows, type RawProfileQueryResult } from "./mapSchoolUserRows";

describe("mapSchoolUserRows", () => {
  const sampleRows: RawProfileQueryResult[] = [
    {
      id: "owner-id",
      full_name: "Platform Owner",
      email: "owner@school.edu",
      phone: null,
      job_title: null,
      department_id: null,
      is_active: true,
      departments: null,
      user_role_assignments: [
        {
          roles: {
            key: "owner",
            name: "Application Owner",
          },
        },
      ],
    },
    {
      id: "head-id",
      full_name: "Amal Head",
      email: "head@school.edu",
      phone: "123456",
      job_title: "Head of Science",
      department_id: "dept-1",
      is_active: true,
      departments: {
        name_ar: "قسم العلوم",
        name_en: "Science Dept",
      },
      user_role_assignments: [
        {
          roles: {
            key: "department_head",
            name: "Department Head",
          },
        },
      ],
    },
    {
      id: "admin-id",
      full_name: "Salwa Manager",
      email: "admin@school.edu",
      phone: null,
      job_title: "School Manager",
      department_id: null,
      is_active: true,
      departments: null,
      user_role_assignments: [
        {
          roles: {
            key: "school_admin",
            name: "School Administrator",
          },
        },
      ],
    },
  ];

  it("filters out the platform owner unconditionally from the school users list", () => {
    const result = mapSchoolUserRows(sampleRows);

    expect(result).toHaveLength(2);
    expect(result.some((u) => u.id === "owner-id")).toBe(false);
    expect(result.some((u) => u.is_owner)).toBe(false);
  });

  it("retains the real role keys for school staff", () => {
    const result = mapSchoolUserRows(sampleRows);

    const head = result.find((u) => u.id === "head-id");
    expect(head).toBeDefined();
    expect(head?.role_key).toBe("department_head");
    expect(head?.department_name).toBe("قسم العلوم");

    const manager = result.find((u) => u.id === "admin-id");
    expect(manager).toBeDefined();
    expect(manager?.role_key).toBe("school_admin");
  });

  it("filters out users identified by ownerUserIds set even if assignment is missing", () => {
    const rowsWithoutRole: RawProfileQueryResult[] = [
      {
        id: "sneaky-owner-id",
        full_name: "Owner Without Role In Joined School",
        email: "sneaky@school.edu",
        job_title: null,
        department_id: null,
        is_active: true,
        departments: null,
        user_role_assignments: [],
      },
      {
        id: "staff-id",
        full_name: "Regular Staff",
        email: "staff@school.edu",
        job_title: "Teacher",
        department_id: null,
        is_active: true,
        departments: null,
        user_role_assignments: [
          {
            roles: {
              key: "staff",
              name: "Staff",
            },
          },
        ],
      },
    ];

    const ownerIds = new Set(["sneaky-owner-id"]);
    const result = mapSchoolUserRows(rowsWithoutRole, false, ownerIds);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("staff-id");
    expect(result[0].role_key).toBe("staff");
  });
});
