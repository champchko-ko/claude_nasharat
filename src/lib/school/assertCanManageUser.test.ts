import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetProfile, mockHasPermission, mockIsOwner, mockMaybeSingle } = vi.hoisted(() => ({
  mockGetProfile: vi.fn(),
  mockHasPermission: vi.fn(),
  mockIsOwner: vi.fn(),
  mockMaybeSingle: vi.fn(),
}));

vi.mock("@/lib/auth/getCurrentProfile", () => ({
  getCurrentProfile: () => mockGetProfile(),
}));

vi.mock("@/lib/rbac/hasPermission", () => ({
  hasPermission: (...args: unknown[]) => mockHasPermission(...args),
}));

vi.mock("@/lib/auth/isPlatformOwner", () => ({
  isPlatformOwner: (...args: unknown[]) => mockIsOwner(...args),
}));

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: () => mockMaybeSingle() }),
      }),
    }),
  }),
}));

import { assertCanManageUser } from "./assertCanManageUser";

const caller = { id: "caller", is_active: true };

describe("assertCanManageUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProfile.mockResolvedValue(caller);
    mockHasPermission.mockResolvedValue(true);
    mockIsOwner.mockResolvedValue(false);
  });

  it("requires a signed-in caller", async () => {
    mockGetProfile.mockResolvedValue(null);

    const result = await assertCanManageUser("colleague");

    expect(result).toEqual({ allowed: false, error: "Authentication required" });
  });

  it("rejects a target that cannot be read", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await assertCanManageUser("unknown-user");

    expect(result).toEqual({ allowed: false, error: "User not found" });
  });

  it("allows an existing, ordinary target", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: "colleague" }, error: null });

    const result = await assertCanManageUser("colleague");

    expect(result).toEqual({ allowed: true, currentUserId: "caller" });
  });

  it("never allows modifying an owner account", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: "owner" }, error: null });
    mockIsOwner.mockResolvedValue(true);

    const result = await assertCanManageUser("owner");

    expect(result.allowed).toBe(false);
  });

  it("stops before reading the target when the caller lacks users.manage", async () => {
    mockHasPermission.mockResolvedValue(false);

    const result = await assertCanManageUser("colleague");

    expect(result.allowed).toBe(false);
    expect(mockMaybeSingle).not.toHaveBeenCalled();
  });

  it("refuses a non-owner who tries to give someone the owner role", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: "colleague" }, error: null });

    const result = await assertCanManageUser("colleague", "owner");

    expect(result).toEqual({ allowed: false, error: "Invalid role selection" });
  });
});
