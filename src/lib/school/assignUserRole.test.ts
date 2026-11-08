import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assignUserRole } from "./assignUserRole";

type RoleRow = { id: string; is_system: boolean; requires_department: boolean } | null;

function buildClient(role: RoleRow, existing: { id: string } | null) {
  const insert = vi.fn().mockResolvedValue({ error: null });
  const updateEq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn().mockReturnValue({ eq: updateEq });
  const assignments = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: existing, error: null }),
    insert,
    update,
  };
  const roles = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: role, error: null }),
  };
  const supabase = {
    from: vi.fn((table: string) => {
      if (table === "roles") return roles;
      if (table === "user_role_assignments") return assignments;
      return {};
    }),
  } as unknown as SupabaseClient;
  return { supabase, insert, update, updateEq };
}

const customRole = { id: "custom-role-id", is_system: false, requires_department: false };
const adminRole = { id: "admin-role-id", is_system: true, requires_department: false };
const headRole = { id: "head-role-id", is_system: true, requires_department: true };

describe("assignUserRole", () => {
  it("gives a custom role the department it was given", async () => {
    const { supabase, insert } = buildClient(customRole, null);

    await assignUserRole(supabase, "user-1", "admin-1", "electrician", "dept-456");

    expect(insert).toHaveBeenCalledWith({
      user_id: "user-1",
      role_id: "custom-role-id",
      department_id: "dept-456",
      assigned_by: "admin-1",
    });
  });

  it("forces department_id to null for a school-wide system role", async () => {
    const { supabase, insert } = buildClient(adminRole, null);

    await assignUserRole(supabase, "user-1", "admin-1", "school_admin", "dept-456");

    expect(insert).toHaveBeenCalledWith({
      user_id: "user-1",
      role_id: "admin-role-id",
      department_id: null,
      assigned_by: "admin-1",
    });
  });

  it("requires a department for a department-bound role", async () => {
    const { supabase, insert } = buildClient(headRole, null);

    await expect(assignUserRole(supabase, "user-1", "admin-1", "department_head")).rejects.toThrow(
      "This role requires a department",
    );
    expect(insert).not.toHaveBeenCalled();
  });

  it("updates the single existing assignment instead of adding a second one", async () => {
    const { supabase, insert, update, updateEq } = buildClient(headRole, { id: "assignment-1" });

    await assignUserRole(supabase, "user-1", "admin-1", "department_head", "dept-9");

    expect(insert).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      role_id: "head-role-id",
      assigned_by: "admin-1",
      department_id: "dept-9",
    });
    expect(updateEq).toHaveBeenCalledWith("id", "assignment-1");
  });

  it("keeps the existing department when none is supplied", async () => {
    const { supabase, update } = buildClient(customRole, { id: "assignment-1" });

    await assignUserRole(supabase, "user-1", "admin-1", "electrician");

    expect(update).toHaveBeenCalledWith({ role_id: "custom-role-id", assigned_by: "admin-1" });
  });

  it("rejects an unknown role", async () => {
    const { supabase } = buildClient(null, null);

    await expect(assignUserRole(supabase, "user-1", "admin-1", "missing_role")).rejects.toThrow(
      "Role 'missing_role' was not found",
    );
  });
});
