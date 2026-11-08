import { describe, it, expect, vi } from "vitest";
import { insertRoleRow } from "./insertRoleRow";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("insertRoleRow", () => {
  it("inserts a custom role with both language names and its permissions", async () => {
    const roleInsert = vi.fn().mockReturnThis();
    const permInsert = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "roles") {
          return {
            insert: roleInsert,
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: "new-role-1" }, error: null }),
          };
        }
        if (table === "role_permissions") {
          return { insert: permInsert };
        }
        return {};
      }),
    } as unknown as SupabaseClient;

    const result = await insertRoleRow(supabase, {
      name: "Custom Supervisor",
      key: "custom_sup",
      permissionKeys: ["circular.create", "circular.respond"],
    });

    expect(result).toEqual({ success: true });
    expect(roleInsert).toHaveBeenCalledWith({
      name_ar: "Custom Supervisor",
      name_en: "Custom Supervisor",
      key: "custom_sup",
      is_system: false,
    });
    expect(permInsert).toHaveBeenCalledWith([
      { role_id: "new-role-1", permission_key: "circular.create" },
      { role_id: "new-role-1", permission_key: "circular.respond" },
    ]);
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
      permissionKeys: ["invalid.permission"],
    });

    expect(deleteMock).toHaveBeenCalled();
    expect(deleteEqMock).toHaveBeenCalledWith("id", "new-role-1");
    expect(result).toEqual({
      success: false,
      error: "Failed to insert role permissions: Permission key not found",
    });
  });

  it("reports a failed role insert without touching permissions", async () => {
    const supabase = {
      from: vi.fn(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "duplicate key" } }),
      })),
    } as unknown as SupabaseClient;

    const result = await insertRoleRow(supabase, { name: "X", key: "x_role", permissionKeys: [] });
    expect(result).toEqual({ success: false, error: "duplicate key" });
  });
});
