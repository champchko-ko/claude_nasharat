import { describe, it, expect, vi } from "vitest";
import { assertCanDeleteRoleRecord } from "./assertCanDeleteRoleRecord";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("assertCanDeleteRoleRecord", () => {
  it("allows owner to delete an unassigned role including system role", async () => {
    const rolesMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: "sys-role-1", key: "operator", is_system: true, school_id: null },
        error: null,
      }),
    };
    const uraMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "roles") return rolesMock;
        if (table === "user_role_assignments") return uraMock;
        return {};
      }),
    } as unknown as SupabaseClient;

    const res = await assertCanDeleteRoleRecord(supabase, "sys-role-1", "school-1", true);
    expect(res.allowed).toBe(true);
  });

  it("blocks deleting the platform owner role even by owner", async () => {
    const rolesMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: "owner-role-id", key: "owner", is_system: true, school_id: null },
        error: null,
      }),
    };

    const supabase = {
      from: vi.fn(() => rolesMock),
    } as unknown as SupabaseClient;

    const res = await assertCanDeleteRoleRecord(supabase, "owner-role-id", "school-1", true);
    expect(res.allowed).toBe(false);
    expect(res.error).toBe("Cannot delete the platform owner role");
  });

  it("blocks deleting a role that has active user assignments", async () => {
    const rolesMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "role-with-users",
          key: "custom_role",
          is_system: false,
          school_id: "school-1",
        },
        error: null,
      }),
    };
    const uraMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [{ id: "assignment-1" }], error: null }),
    };

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "roles") return rolesMock;
        if (table === "user_role_assignments") return uraMock;
        return {};
      }),
    } as unknown as SupabaseClient;

    const res = await assertCanDeleteRoleRecord(supabase, "role-with-users", "school-1", true);
    expect(res.allowed).toBe(false);
    expect(res.error).toBe(
      "Cannot delete role assigned to active users. Please reassign or delete assigned users first.",
    );
  });

  it("blocks non-owner from deleting roles", async () => {
    const rolesMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: "role-1", key: "custom_role", is_system: false, school_id: "school-1" },
        error: null,
      }),
    };

    const supabase = {
      from: vi.fn(() => rolesMock),
    } as unknown as SupabaseClient;

    const res = await assertCanDeleteRoleRecord(supabase, "role-1", "school-1", false);
    expect(res.allowed).toBe(false);
    expect(res.error).toBe("Only the platform owner can delete roles");
  });
});
