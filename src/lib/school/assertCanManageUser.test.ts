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

const caller = { id: "caller", school_id: "school-1", is_active: true };

describe("assertCanManageUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProfile.mockResolvedValue(caller);
    mockHasPermission.mockResolvedValue(true);
    mockIsOwner.mockResolvedValue(false);
  });

  it("rejects a target user from another school (C-1)", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: "foreign-user", school_id: "school-2" },
      error: null,
    });

    const result = await assertCanManageUser("foreign-user");

    expect(result.allowed).toBe(false);
    expect(mockIsOwner).not.toHaveBeenCalled();
  });

  it("rejects a target that cannot be read (RLS hides foreign rows)", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await assertCanManageUser("unknown-user");

    expect(result.allowed).toBe(false);
  });

  it("allows a target in the caller's school", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: "colleague", school_id: "school-1" },
      error: null,
    });

    const result = await assertCanManageUser("colleague");

    expect(result).toEqual({ allowed: true, schoolId: "school-1", currentUserId: "caller" });
  });

  it("never allows modifying a platform owner", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: "owner", school_id: "school-1" },
      error: null,
    });
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
});
