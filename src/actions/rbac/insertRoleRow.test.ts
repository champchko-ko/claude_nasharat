import { describe, it, expect, vi } from "vitest";
import { insertRoleRow } from "./insertRoleRow";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("insertRoleRow", () => {
  it("inserts role and permissions successfully", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "roles") {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: "new-role-1" }, error: null }),
          };
        }
        if (table === "role_permissions") {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient;

    const result = await insertRoleRow(supabase, {
      name: "Custom Supervisor",
      key: "custom_sup",
      schoolId: "school-1",
      permissionKeys: ["circulars.view", "circulars.create"],
    });

    expect(result).toEqual({ success: true });
  });

  it("rolls back created role if permission insert fails", async () => {
    const deleteEqMock = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn().mockReturnValue({ eq: deleteEqMock });

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "roles") {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: "new-role-1" }, error: null }),
            delete: deleteMock,
          };
        }
        if (table === "role_permissions") {
          return {
            insert: vi.fn().mockResolvedValue({ error: { message: "Permission key not found" } }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient;

    const result = await insertRoleRow(supabase, {
      name: "Broken Role",
      key: "broken_key",
      schoolId: "school-1",
      permissionKeys: ["invalid.permission"],
    });

    expect(deleteMock).toHaveBeenCalled();
    expect(deleteEqMock).toHaveBeenCalledWith("id", "new-role-1");
    expect(result).toEqual({
      success: false,
      error: "Failed to insert role permissions: Permission key not found",
    });
  });
});
