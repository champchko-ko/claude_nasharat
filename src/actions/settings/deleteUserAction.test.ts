import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteUserAction } from "./deleteUserAction";

const {
  mockGetCurrentProfile,
  mockIsPlatformOwner,
  mockHasPermission,
  mockResolveSchoolForCaller,
  mockServerRpc,
  mockAdminFrom,
} = vi.hoisted(() => ({
  mockGetCurrentProfile: vi.fn(),
  mockIsPlatformOwner: vi.fn(),
  mockHasPermission: vi.fn(),
  mockResolveSchoolForCaller: vi.fn(),
  mockServerRpc: vi.fn(),
  mockAdminFrom: vi.fn(),
}));

vi.mock("@/lib/auth/getCurrentProfile", () => ({
  getCurrentProfile: () => mockGetCurrentProfile(),
}));

vi.mock("@/lib/auth/isPlatformOwner", () => ({
  isPlatformOwner: (...args: unknown[]) => mockIsPlatformOwner(...args),
}));

vi.mock("@/lib/rbac/hasPermission", () => ({
  hasPermission: (...args: unknown[]) => mockHasPermission(...args),
}));

vi.mock("@/lib/school/resolveSchoolForCaller", () => ({
  resolveSchoolForCaller: (...args: unknown[]) => mockResolveSchoolForCaller(...args),
}));

vi.mock("@/lib/settings/revalidateSettingsPath", () => ({
  revalidateSettingsPath: vi.fn(),
}));

vi.mock("@/lib/school/assertNotLastActiveSchoolAdmin", () => ({
  assertNotLastActiveSchoolAdmin: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    rpc: (...args: unknown[]) => mockServerRpc(...args),
  }),
  createSupabaseAdminClient: vi.fn().mockReturnValue({
    from: (...args: unknown[]) => mockAdminFrom(...args),
  }),
}));

describe("deleteUserAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails when unauthenticated", async () => {
    mockGetCurrentProfile.mockResolvedValue(null);

    const res = await deleteUserAction("target-user-1");

    expect(res.success).toBe(false);
    expect(res.error).toBe("Authentication required");
  });

  it("prevents self-deletion", async () => {
    mockGetCurrentProfile.mockResolvedValue({ id: "user-1", school_id: "school-1" });

    const res = await deleteUserAction("user-1");

    expect(res.success).toBe(false);
    expect(res.error).toBe("Cannot delete your own account");
  });

  it("prevents deleting a system platform owner", async () => {
    mockGetCurrentProfile.mockResolvedValue({ id: "caller-1", school_id: "school-1" });
    mockIsPlatformOwner.mockImplementation(async (id: string) => id === "target-owner");

    const res = await deleteUserAction("target-owner");

    expect(res.success).toBe(false);
    expect(res.error).toBe("Cannot modify system-protected account");
  });

  it("allows platform owner full control to permanently delete a user from database", async () => {
    mockGetCurrentProfile.mockResolvedValue({ id: "owner-1", school_id: "school-1" });
    mockIsPlatformOwner.mockImplementation(async (id: string) => id === "owner-1");

    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: "target-1", school_id: "school-1", is_active: true },
      error: null,
    });

    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({ eq: () => ({ maybeSingle: mockMaybeSingle }) }),
          delete: mockDelete,
        };
      }
      if (
        table === "user_role_assignments" ||
        table === "circular_responses" ||
        table === "maintenance_assignments"
      ) {
        return { delete: mockDelete };
      }
      if (table === "maintenance_requests") {
        return { update: mockUpdate };
      }
      return {};
    });

    const res = await deleteUserAction("target-1");

    expect(res.success).toBe(true);
    expect(mockDelete).toHaveBeenCalled();
  });
});
