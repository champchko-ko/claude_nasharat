import { describe, it, expect, vi } from "vitest";
import { assignUserRole } from "./assignUserRole";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("assignUserRole", () => {
  it("scopes role resolution and prefers school-scoped role over system role, setting department", async () => {
    const rolesMock = [
      { id: "system-role-id", school_id: null, is_system: true },
      { id: "school-role-id", school_id: "school-123", is_system: false },
    ];

    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const userRoleMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: insertMock,
    };

    const rolesMockObj = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockResolvedValue({ data: rolesMock, error: null }),
    };

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "roles") return rolesMockObj;
        if (table === "user_role_assignments") return userRoleMock;
        return {};
      }),
    } as unknown as SupabaseClient;

    await assignUserRole(supabase, "user-1", "school-123", "admin-1", "custom_role", "dept-456");

    expect(insertMock).toHaveBeenCalledWith({
      user_id: "user-1",
      role_id: "school-role-id",
      school_id: "school-123",
      department_id: "dept-456",
      assigned_by: "admin-1",
    });
  });

  it("forces department_id to null for school-wide roles like school_admin", async () => {
    const rolesMock = [{ id: "admin-role-id", school_id: null, is_system: true }];
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const userRoleMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: insertMock,
    };
    const rolesMockObj = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockResolvedValue({ data: rolesMock, error: null }),
    };

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "roles") return rolesMockObj;
        if (table === "user_role_assignments") return userRoleMock;
        return {};
      }),
    } as unknown as SupabaseClient;

    await assignUserRole(supabase, "user-1", "school-123", "admin-1", "school_admin", "dept-456");

    expect(insertMock).toHaveBeenCalledWith({
      user_id: "user-1",
      role_id: "admin-role-id",
      school_id: "school-123",
      department_id: null,
      assigned_by: "admin-1",
    });
  });

  it("throws descriptive error when role is not found", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    } as unknown as SupabaseClient;

    await expect(
      assignUserRole(supabase, "user-1", "school-123", "admin-1", "missing_role"),
    ).rejects.toThrow("Role 'missing_role' was not found for school 'school-123'");
  });

  it("updates existing role assignment and checks update error", async () => {
    const rolesMock = [{ id: "system-role-id", school_id: null, is_system: true }];

    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: new Error("DB write timeout") }),
    });

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "roles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            or: vi.fn().mockResolvedValue({ data: rolesMock, error: null }),
          };
        }
        if (table === "user_role_assignments") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: "existing-assignment-id" },
              error: null,
            }),
            update: updateMock,
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient;

    await expect(
      assignUserRole(supabase, "user-1", "school-123", "admin-1", "teacher", "dept-789"),
    ).rejects.toThrow("Failed to update user role assignment");

    expect(updateMock).toHaveBeenCalledWith({
      role_id: "system-role-id",
      assigned_by: "admin-1",
      department_id: "dept-789",
    });
  });
});
