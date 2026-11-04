import { describe, expect, it, vi } from "vitest";
import { getMaintenanceOperators } from "./getMaintenanceOperators";
import * as getSchoolUsersModule from "@/lib/school/getSchoolUsers";

vi.mock("@/lib/school/getSchoolUsers", () => ({
  getSchoolUsers: vi.fn(),
}));

describe("getMaintenanceOperators", () => {
  it("filters and returns only active users whose role_key is operator", async () => {
    vi.spyOn(getSchoolUsersModule, "getSchoolUsers").mockResolvedValueOnce([
      {
        id: "op-1",
        full_name: "Active Technician",
        email: "tech1@school.edu",
        phone: null,
        job_title: "Electrician",
        department_id: null,
        department_name: null,
        role_key: "operator",
        is_active: true,
        is_owner: false,
      },
      {
        id: "op-2",
        full_name: "Inactive Technician",
        email: "tech2@school.edu",
        phone: null,
        job_title: "Plumber",
        department_id: null,
        department_name: null,
        role_key: "operator",
        is_active: false,
        is_owner: false,
      },
      {
        id: "admin-1",
        full_name: "School Manager",
        email: "manager@school.edu",
        phone: null,
        job_title: "Manager",
        department_id: null,
        department_name: null,
        role_key: "school_admin",
        is_active: true,
        is_owner: false,
      },
      {
        id: "teacher-1",
        full_name: "Math Teacher",
        email: "teacher@school.edu",
        phone: null,
        job_title: "Teacher",
        department_id: null,
        department_name: null,
        role_key: "staff",
        is_active: true,
        is_owner: false,
      },
    ]);

    const result = await getMaintenanceOperators("school-123");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("op-1");
    expect(result[0].role_key).toBe("operator");
  });

  it("returns an empty array when no operator exists in the school", async () => {
    vi.spyOn(getSchoolUsersModule, "getSchoolUsers").mockResolvedValueOnce([
      {
        id: "head-1",
        full_name: "Department Head",
        email: "head@school.edu",
        phone: null,
        job_title: "Head",
        department_id: null,
        department_name: null,
        role_key: "department_head",
        is_active: true,
        is_owner: false,
      },
    ]);

    const result = await getMaintenanceOperators("school-123");
    expect(result).toEqual([]);
  });
});
