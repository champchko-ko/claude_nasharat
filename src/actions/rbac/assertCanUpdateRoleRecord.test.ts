import { describe, it, expect, vi } from "vitest";
import { assertCanUpdateRoleRecord } from "./assertCanUpdateRoleRecord";
import type { SupabaseClient } from "@supabase/supabase-js";

function clientReturning(role: unknown) {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: role, error: null }),
    })),
  } as unknown as SupabaseClient;
}

describe("assertCanUpdateRoleRecord", () => {
  it("lets the owner edit a system role and reports it as a system role", async () => {
    const supabase = clientReturning({ id: "r1", is_system: true, is_locked: false });
    await expect(assertCanUpdateRoleRecord(supabase, "r1", true)).resolves.toEqual({
      isSystem: true,
    });
  });

  it("lets the owner edit a custom role", async () => {
    const supabase = clientReturning({ id: "r2", is_system: false, is_locked: false });
    await expect(assertCanUpdateRoleRecord(supabase, "r2", true)).resolves.toEqual({
      isSystem: false,
    });
  });

  it("refuses everyone but the owner", async () => {
    const supabase = clientReturning({ id: "r2", is_system: false, is_locked: false });
    await expect(assertCanUpdateRoleRecord(supabase, "r2", false)).rejects.toThrow(
      "Only the owner can modify roles",
    );
  });

  it("refuses to edit the locked owner role, even for the owner", async () => {
    const supabase = clientReturning({ id: "r3", is_system: true, is_locked: true });
    await expect(assertCanUpdateRoleRecord(supabase, "r3", true)).rejects.toThrow(
      "The owner role is locked",
    );
  });

  it("refuses an unknown role", async () => {
    const supabase = clientReturning(null);
    await expect(assertCanUpdateRoleRecord(supabase, "missing", true)).rejects.toThrow(
      "Role not found",
    );
  });
});
