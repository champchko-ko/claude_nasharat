import { beforeEach, describe, expect, it, vi } from "vitest";

const { builder } = vi.hoisted(() => ({
  builder: {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
  },
}));

vi.mock("@/lib/supabase", () => ({
  createSupabaseAdminClient: vi.fn(() => ({ from: vi.fn(() => builder) })),
}));

import { isPlatformOwner } from "./isPlatformOwner";

describe("isPlatformOwner", () => {
  beforeEach(() => {
    builder.maybeSingle.mockReset();
    builder.eq.mockClear();
  });

  it("is false without a user id and does not query", async () => {
    await expect(isPlatformOwner(null)).resolves.toBe(false);
    expect(builder.maybeSingle).not.toHaveBeenCalled();
  });

  it("is true when the user holds the owner role", async () => {
    builder.maybeSingle.mockResolvedValue({ data: { id: "a1" }, error: null });
    await expect(isPlatformOwner("user-1")).resolves.toBe(true);
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(builder.eq).toHaveBeenCalledWith("roles.key", "owner");
  });

  it("is false when the user has no owner assignment", async () => {
    builder.maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(isPlatformOwner("user-1")).resolves.toBe(false);
  });

  it("is false when the lookup fails", async () => {
    builder.maybeSingle.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(isPlatformOwner("user-1")).resolves.toBe(false);
  });
});
