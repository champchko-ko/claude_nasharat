import { describe, it, expect, vi } from "vitest";
import { assertCanDeleteRoleRecord } from "./assertCanDeleteRoleRecord";
import type { SupabaseClient } from "@supabase/supabase-js";

function clientWith(role: unknown, assignments: unknown[] = []) {
  const rolesMock = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: role, error: null }),
  };
  const uraMock = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: assignments, error: null }),
  };
  return {
    from: vi.fn((table: string) => {
      if (table === "roles") return rolesMock;
      if (table === "user_role_assignments") return uraMock;
      return {};
    }),
  } as unknown as SupabaseClient;
}

const customRole = { id: "c1", key: "electrician", is_system: false, is_locked: false };

describe("assertCanDeleteRoleRecord", () => {
  it("lets the owner delete an unassigned custom role", async () => {
    const res = await assertCanDeleteRoleRecord(clientWith(customRole), "c1", true);
    expect(res.allowed).toBe(true);
  });

  it("refuses everyone but the owner", async () => {
    const res = await assertCanDeleteRoleRecord(clientWith(customRole), "c1", false);
    expect(res).toEqual({ allowed: false, error: "Only the owner can delete roles" });
  });

  it("never deletes a system role, even for the owner", async () => {
    const role = { id: "s1", key: "operator", is_system: true, is_locked: false };
    const res = await assertCanDeleteRoleRecord(clientWith(role), "s1", true);
    expect(res).toEqual({ allowed: false, error: "System roles cannot be deleted" });
  });

  it("never deletes the locked owner role", async () => {
    const role = { id: "o1", key: "owner", is_system: true, is_locked: true };
    const res = await assertCanDeleteRoleRecord(clientWith(role), "o1", true);
    expect(res).toEqual({ allowed: false, error: "Cannot delete the owner role" });
  });

  it("refuses a role that still has users", async () => {
    const res = await assertCanDeleteRoleRecord(clientWith(customRole, [{ id: "a1" }]), "c1", true);
    expect(res.allowed).toBe(false);
    expect(res.error).toContain("assigned to active users");
  });

  it("reports an unknown role", async () => {
    const res = await assertCanDeleteRoleRecord(clientWith(null), "missing", true);
    expect(res).toEqual({ allowed: false, error: "Role not found" });
  });
});
