import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NotFoundError } from "@/lib/errors/NotFoundError";
import { resolveRoleForAssignment } from "./resolveRoleForAssignment";

function clientReturning(result: { data: unknown; error: unknown }) {
  const eq = vi.fn().mockReturnThis();
  const client = {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq,
      maybeSingle: vi.fn().mockResolvedValue(result),
    })),
  } as unknown as SupabaseClient;
  return { client, eq };
}

describe("resolveRoleForAssignment", () => {
  it("finds a role by key and reports its flags", async () => {
    const { client, eq } = clientReturning({
      data: { id: "r1", is_system: true, requires_department: false },
      error: null,
    });

    await expect(resolveRoleForAssignment(client, "school_admin")).resolves.toEqual({
      id: "r1",
      isSystem: true,
      requiresDepartment: false,
    });
    expect(eq).toHaveBeenCalledWith("key", "school_admin");
  });

  it("throws NotFoundError for an unknown key", async () => {
    const { client } = clientReturning({ data: null, error: null });
    await expect(resolveRoleForAssignment(client, "missing_role")).rejects.toThrow(NotFoundError);
  });

  it("surfaces database errors", async () => {
    const { client } = clientReturning({ data: null, error: { message: "boom", code: "XX000" } });
    await expect(resolveRoleForAssignment(client, "staff")).rejects.toThrow();
  });
});
