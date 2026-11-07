import { describe, it, expect, vi, beforeEach } from "vitest";
import { toggleUserActiveAction } from "./toggleUserActiveAction";

const {
  mockGetCurrentProfile,
  mockIsPlatformOwner,
  mockHasPermission,
  mockResolveSchoolForCaller,
  mockAdminFrom,
} = vi.hoisted(() => ({
  mockGetCurrentProfile: vi.fn(),
  mockIsPlatformOwner: vi.fn(),
  mockHasPermission: vi.fn(),
  mockResolveSchoolForCaller: vi.fn(),
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
  createSupabaseAdminClient: vi.fn().mockReturnValue({
    from: (...args: unknown[]) => mockAdminFrom(...args),
  }),
}));

describe("toggleUserActiveAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails when unauthenticated", async () => {
    mockGetCurrentProfile.mockResolvedValue(null);

    const res = await toggleUserActiveAction("target-1", true);

    expect(res.success).toBe(false);
    expect(res.error).toBe("Authentication required");
  });

  it("prevents changing own active status", async () => {
    mockGetCurrentProfile.mockResolvedValue({ id: "user-1", school_id: "school-1" });

    const res = await toggleUserActiveAction("user-1", true);

    expect(res.success).toBe(false);
    expect(res.error).toBe("Cannot change your own active status");
  });

  it("allows platform owner full control to toggle user status", async () => {
    mockGetCurrentProfile.mockResolvedValue({ id: "owner-1", school_id: "school-1" });
    mockIsPlatformOwner.mockImplementation(async (id: string) => id === "owner-1");

    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: { id: "target-1" }, error: null });
    const mockSelect = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

    mockAdminFrom.mockReturnValue({
      update: mockUpdate,
    });

    const res = await toggleUserActiveAction("target-1", false);

    expect(res.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({ is_active: true });
  });
});
