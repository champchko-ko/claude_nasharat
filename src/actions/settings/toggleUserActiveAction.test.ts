import { describe, it, expect, vi, beforeEach } from "vitest";
import { toggleUserActiveAction } from "./toggleUserActiveAction";

const { mockGetCurrentProfile, mockIsPlatformOwner, mockHasPermission, mockAdminFrom } =
  vi.hoisted(() => ({
    mockGetCurrentProfile: vi.fn(),
    mockIsPlatformOwner: vi.fn(),
    mockHasPermission: vi.fn(),
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

vi.mock("@/lib/settings/revalidateSettingsPath", () => ({
  revalidateSettingsPath: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  createSupabaseAdminClient: vi.fn().mockReturnValue({
    from: (...args: unknown[]) => mockAdminFrom(...args),
  }),
}));

function profilesUpdate(updatedRow: unknown) {
  const mockMaybeSingle = vi.fn().mockResolvedValue({ data: updatedRow, error: null });
  const mockSelect = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
  const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
  mockAdminFrom.mockReturnValue({ update: mockUpdate });
  return { mockUpdate, mockEq };
}

describe("toggleUserActiveAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPlatformOwner.mockResolvedValue(false);
    mockHasPermission.mockResolvedValue(false);
  });

  it("fails when unauthenticated", async () => {
    mockGetCurrentProfile.mockResolvedValue(null);

    const res = await toggleUserActiveAction("target-1", true);

    expect(res.success).toBe(false);
    expect(res.error).toBe("Authentication required");
  });

  it("prevents changing own active status", async () => {
    mockGetCurrentProfile.mockResolvedValue({ id: "user-1" });

    const res = await toggleUserActiveAction("user-1", true);

    expect(res.success).toBe(false);
    expect(res.error).toBe("Cannot change your own active status");
  });

  it("never touches an owner account", async () => {
    mockGetCurrentProfile.mockResolvedValue({ id: "admin-1" });
    mockIsPlatformOwner.mockImplementation(async (id: string) => id === "owner-1");
    mockHasPermission.mockResolvedValue(true);

    const res = await toggleUserActiveAction("owner-1", true);

    expect(res.success).toBe(false);
    expect(res.error).toBe("Cannot modify system-protected account");
    expect(mockAdminFrom).not.toHaveBeenCalled();
  });

  it("allows the owner to toggle user status", async () => {
    mockGetCurrentProfile.mockResolvedValue({ id: "owner-1" });
    mockIsPlatformOwner.mockImplementation(async (id: string) => id === "owner-1");
    const { mockUpdate, mockEq } = profilesUpdate({ id: "target-1" });

    const res = await toggleUserActiveAction("target-1", false);

    expect(res.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({ is_active: true });
    expect(mockEq).toHaveBeenCalledWith("id", "target-1");
  });

  it("allows a users.manage holder to toggle user status", async () => {
    mockGetCurrentProfile.mockResolvedValue({ id: "admin-1" });
    mockHasPermission.mockResolvedValue(true);
    const { mockUpdate } = profilesUpdate({ id: "target-1" });

    const res = await toggleUserActiveAction("target-1", true);

    expect(res.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({ is_active: false });
  });

  it("refuses a caller without users.manage", async () => {
    mockGetCurrentProfile.mockResolvedValue({ id: "teacher-1" });

    const res = await toggleUserActiveAction("target-1", true);

    expect(res.success).toBe(false);
    expect(res.error).toBe("Unauthorized");
    expect(mockAdminFrom).not.toHaveBeenCalled();
  });

  it("reports a user that does not exist", async () => {
    mockGetCurrentProfile.mockResolvedValue({ id: "owner-1" });
    mockIsPlatformOwner.mockImplementation(async (id: string) => id === "owner-1");
    profilesUpdate(null);

    const res = await toggleUserActiveAction("missing", true);

    expect(res.success).toBe(false);
    expect(res.error).toBe("User not found");
  });
});
