import { describe, it, expect, vi } from "vitest";
import { syncRolePermissions } from "./syncRolePermissions";
import type { SupabaseClient } from "@supabase/supabase-js";

function buildClient(current: string[], insertError: unknown = null) {
  const insert = vi.fn().mockResolvedValue({ error: insertError });
  const inMock = vi.fn().mockResolvedValue({ error: null });
  const deleteEq = vi.fn().mockReturnValue({ in: inMock });
  const del = vi.fn().mockReturnValue({ eq: deleteEq });
  const select = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({
      data: current.map((permission_key) => ({ permission_key })),
      error: null,
    }),
  });
  const supabase = {
    from: vi.fn(() => ({ select, insert, delete: del })),
  } as unknown as SupabaseClient;
  return { supabase, insert, del, deleteEq, inMock };
}

describe("syncRolePermissions", () => {
  it("adds new grants and removes dropped ones, writing only the difference", async () => {
    const { supabase, insert, del, deleteEq, inMock } = buildClient(["a.one", "b.two"]);

    await syncRolePermissions(supabase, "role-1", ["b.two", "c.three"]);

    expect(insert).toHaveBeenCalledWith([{ role_id: "role-1", permission_key: "c.three" }]);
    expect(del).toHaveBeenCalledTimes(1);
    expect(deleteEq).toHaveBeenCalledWith("role_id", "role-1");
    expect(inMock).toHaveBeenCalledWith("permission_key", ["a.one"]);
  });

  it("writes nothing when the role already holds exactly these permissions", async () => {
    const { supabase, insert, del } = buildClient(["a.one"]);

    await syncRolePermissions(supabase, "role-1", ["a.one"]);

    expect(insert).not.toHaveBeenCalled();
    expect(del).not.toHaveBeenCalled();
  });

  it("does not remove anything when adding a grant fails", async () => {
    const { supabase, del } = buildClient(["a.one"], { message: "unknown permission" });

    await expect(syncRolePermissions(supabase, "role-1", ["bad.key"])).rejects.toEqual({
      message: "unknown permission",
    });
    expect(del).not.toHaveBeenCalled();
  });
});
