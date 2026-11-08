import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockIsOwner, mockHasPermission } = vi.hoisted(() => ({
  mockIsOwner: vi.fn(),
  mockHasPermission: vi.fn(),
}));

vi.mock("@/lib/auth/isPlatformOwner", () => ({
  isPlatformOwner: (...args: unknown[]) => mockIsOwner(...args),
}));
vi.mock("@/lib/rbac/hasPermission", () => ({
  hasPermission: (...args: unknown[]) => mockHasPermission(...args),
}));

import { resolveUserManagementAccess } from "./resolveUserManagementAccess";

const profile = {
  id: "u-1",
  full_name: "User",
  email: null,
  job_title: null,
  department_id: null,
  is_active: true,
};

describe("resolveUserManagementAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsOwner.mockResolvedValue(false);
    mockHasPermission.mockResolvedValue(false);
  });

  it("grants nothing without a profile", async () => {
    await expect(resolveUserManagementAccess(null)).resolves.toEqual({
      isPlatformOwner: false,
      schoolId: null,
      canManageUsers: false,
      canManageRoles: false,
    });
  });

  it("gives the owner both user and role management without asking for a permission", async () => {
    mockIsOwner.mockResolvedValue(true);

    const access = await resolveUserManagementAccess(profile);

    expect(access).toMatchObject({
      isPlatformOwner: true,
      canManageUsers: true,
      canManageRoles: true,
    });
    expect(mockHasPermission).not.toHaveBeenCalled();
  });

  it("lets a users.manage holder manage users but never roles", async () => {
    mockHasPermission.mockResolvedValue(true);

    const access = await resolveUserManagementAccess(profile);

    expect(access).toMatchObject({ canManageUsers: true, canManageRoles: false });
    expect(mockHasPermission).toHaveBeenCalledWith("users.manage");
  });

  it("treats a failed permission check as no access", async () => {
    mockHasPermission.mockRejectedValue(new Error("db down"));

    const access = await resolveUserManagementAccess(profile);

    expect(access.canManageUsers).toBe(false);
  });
});
