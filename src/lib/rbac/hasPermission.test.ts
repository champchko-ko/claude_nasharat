import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn(async () => ({ rpc })),
}));

import { hasPermission } from "./hasPermission";

describe("hasPermission", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("asks the database and returns its answer", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    await expect(hasPermission("circular.create")).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith("has_permission", {
      p_permission: "circular.create",
      p_department: null,
    });
  });

  it("returns false when the database says no", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    await expect(hasPermission("users.manage")).resolves.toBe(false);
  });

  it("ignores the legacy school argument and passes the department", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    await hasPermission("circular.respond", "legacy-school-id", "dept-1");
    expect(rpc).toHaveBeenCalledWith("has_permission", {
      p_permission: "circular.respond",
      p_department: "dept-1",
    });
  });

  it("throws instead of guessing when the check itself fails", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom", code: "XX000" } });
    await expect(hasPermission("audit.view")).rejects.toThrow();
  });
});
