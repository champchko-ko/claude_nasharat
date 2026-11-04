import { describe, it, expect, vi } from "vitest";
import { assertCanUpdateRoleRecord } from "./assertCanUpdateRoleRecord";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("assertCanUpdateRoleRecord", () => {
  it("allows owner to update any role including system roles", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: "sys-role-1", is_system: true, school_id: null },
          error: null,
        }),
      })),
    } as unknown as SupabaseClient;

    await expect(
      assertCanUpdateRoleRecord(supabase, "sys-role-1", "school-1", true),
    ).resolves.toBeUndefined();
  });

  it("throws ForbiddenError when non-owner tries to update system role", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: "sys-role-1", is_system: true, school_id: null },
          error: null,
        }),
      })),
    } as unknown as SupabaseClient;

    await expect(
      assertCanUpdateRoleRecord(supabase, "sys-role-1", "school-1", false),
    ).rejects.toThrow("Cannot modify system or unauthorized roles");
  });

  it("allows non-owner to update their own school custom role", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: "custom-role-1", is_system: false, school_id: "school-1" },
          error: null,
        }),
      })),
    } as unknown as SupabaseClient;

    await expect(
      assertCanUpdateRoleRecord(supabase, "custom-role-1", "school-1", false),
    ).resolves.toBeUndefined();
  });

  it("throws ForbiddenError when role is not found", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })),
    } as unknown as SupabaseClient;

    await expect(assertCanUpdateRoleRecord(supabase, "missing", "school-1", true)).rejects.toThrow(
      "Role not found",
    );
  });
});
