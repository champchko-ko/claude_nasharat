import { describe, it, expect, vi, beforeEach } from "vitest";
import { assertNotLastActiveSchoolAdmin } from "./assertNotLastActiveSchoolAdmin";
import { ConflictError } from "@/lib/errors/ConflictError";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("assertNotLastActiveSchoolAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes when RPC returns false (not the last admin)", async () => {
    const mockClient = {
      rpc: vi.fn().mockResolvedValue({ data: false, error: null }),
    } as unknown as SupabaseClient;

    await expect(assertNotLastActiveSchoolAdmin(mockClient, "user-1")).resolves.toBeUndefined();
  });

  it("throws ConflictError when RPC returns true (is the last admin)", async () => {
    const mockClient = {
      rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
    } as unknown as SupabaseClient;

    await expect(assertNotLastActiveSchoolAdmin(mockClient, "user-1")).rejects.toThrow(
      ConflictError,
    );
  });

  it("uses fallback when RPC is not in schema cache (PGRST202)", async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: { school_id: "school-1", is_active: true },
                  error: null,
                }),
            }),
          }),
        };
      }
      if (table === "user_role_assignments") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: () =>
                    Promise.resolve({
                      data: { id: "assign-1", roles: { key: "school_admin" } },
                      error: null,
                    }),
                  neq: () => ({
                    limit: () =>
                      Promise.resolve({ data: [{ user_id: "other-admin" }], error: null }),
                  }),
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const mockClient = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST202", message: "function not found" },
      }),
      from: mockFrom,
    } as unknown as SupabaseClient;

    await expect(assertNotLastActiveSchoolAdmin(mockClient, "user-1")).resolves.toBeUndefined();
  });
});
