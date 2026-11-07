import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteUserAction } from "./deleteUserAction";

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

function mockTables(targetProfile: unknown) {
  const mockDelete = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  const mockMaybeSingle = vi.fn().mockResolvedValue({ data: targetProfile, error: null });

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
  return { mockDelete };
}

describe("deleteUserAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPlatformOwner.mockResolvedValue(false);
    mockHasPermission.mockResolvedValue(false);
  });

  it("fails when unauthenticated", async () => {
    mockGetCurrentProfile.mockResolvedValue(null);

    const res = await deleteUserAction("target-user-1");

    expect(res.success).toBe(false);
    expect(res.error).toBe("Authentication required");
  });

  it("prevents self-deletion", async () => {
    mockGetCurrentProfile.mockResolvedValue({ id: "user-1" });

    const res = await deleteUserAction("user-1");

    expect(res.success).toBe(false);
    expect(res.error).toBe("Cannot delete your own account");
  });

  it("prevents deleting an owner account", async () => {
    mockGetCurrentProfile.mockResolvedValue({ id: "caller-1" });
    mockIsPlatformOwner.mockImplementation(async (id: string) => id === "target-owner");

    const res = await deleteUserAction("target-owner");

    expect(res.success).toBe(false);
    expect(res.error).toBe("Cannot modify system-protected account");
  });

  it("refuses a caller without users.manage", async () => {
    mockGetCurrentProfile.mockResolvedValue({ id: "teacher-1" });

    const res = await deleteUserAction("target-1");

    expect(res.success).toBe(false);
    expect(res.error).toBe("Unauthorized");
    expect(mockAdminFrom).not.toHaveBeenCalled();
  });

  it("allows the owner to permanently delete a user", async () => {
    mockGetCurrentProfile.mockResolvedValue({ id: "owner-1" });
    mockIsPlatformOwner.mockImplementation(async (id: string) => id === "owner-1");
    const { mockDelete } = mockTables({ id: "target-1" });

    const res = await deleteUserAction("target-1");

    expect(res.success).toBe(true);
    expect(mockDelete).toHaveBeenCalled();
  });

  it("allows a users.manage holder to delete a user", async () => {
    mockGetCurrentProfile.mockResolvedValue({ id: "admin-1" });
    mockHasPermission.mockResolvedValue(true);
    const { mockDelete } = mockTables({ id: "target-1" });

    const res = await deleteUserAction("target-1");

    expect(res.success).toBe(true);
    expect(mockDelete).toHaveBeenCalled();
  });

  it("reports a user that does not exist", async () => {
    mockGetCurrentProfile.mockResolvedValue({ id: "owner-1" });
    mockIsPlatformOwner.mockImplementation(async (id: string) => id === "owner-1");
    mockTables(null);

    const res = await deleteUserAction("missing");

    expect(res.success).toBe(false);
    expect(res.error).toBe("User not found");
  });
});
