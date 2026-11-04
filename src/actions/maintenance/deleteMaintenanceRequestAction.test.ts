import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteMaintenanceRequestAction } from "./deleteMaintenanceRequestAction";

const {
  mockGetCurrentProfile,
  mockIsPlatformOwner,
  mockHasPermission,
  mockDeleteRecord,
} = vi.hoisted(() => ({
  mockGetCurrentProfile: vi.fn(),
  mockIsPlatformOwner: vi.fn(),
  mockHasPermission: vi.fn(),
  mockDeleteRecord: vi.fn(),
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

vi.mock("@/lib/maintenance/deleteMaintenanceRequestRecord", () => ({
  deleteMaintenanceRequestRecord: (...args: unknown[]) => mockDeleteRecord(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({}),
  createSupabaseAdminClient: vi.fn().mockReturnValue({}),
}));

describe("deleteMaintenanceRequestAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails when not authenticated", async () => {
    mockGetCurrentProfile.mockResolvedValue(null);
    const res = await deleteMaintenanceRequestAction("req-1");
    expect(res.success).toBe(false);
    expect(res.error).toBe("Authentication required");
  });

  it("fails when user lacks permission", async () => {
    mockGetCurrentProfile.mockResolvedValue({ id: "user-1", school_id: "school-1" });
    mockIsPlatformOwner.mockResolvedValue(false);
    mockHasPermission.mockResolvedValue(false);

    const res = await deleteMaintenanceRequestAction("req-1");
    expect(res.success).toBe(false);
    expect(res.error).toBe("Unauthorized to delete maintenance request");
  });

  it("succeeds when user is platform owner", async () => {
    mockGetCurrentProfile.mockResolvedValue({ id: "owner-1", school_id: "school-1" });
    mockIsPlatformOwner.mockResolvedValue(true);
    mockDeleteRecord.mockResolvedValue({ success: true });

    const res = await deleteMaintenanceRequestAction("req-1");
    expect(res.success).toBe(true);
  });

  it("succeeds when user has maintenance.close permission", async () => {
    mockGetCurrentProfile.mockResolvedValue({ id: "admin-1", school_id: "school-1" });
    mockIsPlatformOwner.mockResolvedValue(false);
    mockHasPermission.mockImplementation(async (perm: string) => perm === "maintenance.close");
    mockDeleteRecord.mockResolvedValue({ success: true });

    const res = await deleteMaintenanceRequestAction("req-1");
    expect(res.success).toBe(true);
  });
});
