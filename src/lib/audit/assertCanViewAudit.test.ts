import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetCurrentProfile, mockIsPlatformOwner, mockHasPermission } = vi.hoisted(() => ({
  mockGetCurrentProfile: vi.fn(),
  mockIsPlatformOwner: vi.fn(),
  mockHasPermission: vi.fn(),
}));

vi.mock("@/lib/auth/getCurrentProfile", () => ({
  getCurrentProfile: mockGetCurrentProfile,
}));

vi.mock("@/lib/auth/isPlatformOwner", () => ({
  isPlatformOwner: mockIsPlatformOwner,
}));

vi.mock("@/lib/rbac/hasPermission", () => ({
  hasPermission: mockHasPermission,
}));

import { assertCanViewAudit } from "./assertCanViewAudit";

describe("assertCanViewAudit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns unauthorized when profile is missing", async () => {
    mockGetCurrentProfile.mockResolvedValue(null);

    const result = await assertCanViewAudit();
    expect(result.authorized).toBe(false);
  });

  it("authorizes platform owner even without school_id", async () => {
    mockGetCurrentProfile.mockResolvedValue({ id: "owner-1", school_id: null });
    mockIsPlatformOwner.mockResolvedValue(true);

    const result = await assertCanViewAudit();
    expect(result.authorized).toBe(true);
    if (result.authorized) {
      expect(result.isOwner).toBe(true);
      expect(result.schoolId).toBeNull();
    }
  });

  it("authorizes user with audit.view permission", async () => {
    mockGetCurrentProfile.mockResolvedValue({ id: "user-1", school_id: "sch-1" });
    mockIsPlatformOwner.mockResolvedValue(false);
    mockHasPermission.mockResolvedValue(true);

    const result = await assertCanViewAudit();
    expect(result.authorized).toBe(true);
    if (result.authorized) {
      expect(result.isOwner).toBe(false);
      expect(result.schoolId).toBe("sch-1");
    }
  });

  it("denies user without audit.view permission", async () => {
    mockGetCurrentProfile.mockResolvedValue({ id: "user-2", school_id: "sch-1" });
    mockIsPlatformOwner.mockResolvedValue(false);
    mockHasPermission.mockResolvedValue(false);

    const result = await assertCanViewAudit();
    expect(result.authorized).toBe(false);
  });
});
