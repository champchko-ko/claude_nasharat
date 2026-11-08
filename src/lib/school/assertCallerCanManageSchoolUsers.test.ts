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

import { assertCallerCanManageSchoolUsers } from "./assertCallerCanManageSchoolUsers";

const profile = {
  id: "u-1",
  full_name: "User",
  email: null,
  job_title: null,
  department_id: null,
  is_active: true,
};

describe("assertCallerCanManageSchoolUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsOwner.mockResolvedValue(false);
    mockHasPermission.mockResolvedValue(false);
  });

  it("allows the owner", async () => {
    mockIsOwner.mockResolvedValue(true);
    await expect(assertCallerCanManageSchoolUsers(profile)).resolves.toEqual({
      allowed: true,
      isOwner: true,
    });
  });

  it("allows a users.manage holder who is not the owner", async () => {
    mockHasPermission.mockResolvedValue(true);
    await expect(assertCallerCanManageSchoolUsers(profile)).resolves.toEqual({
      allowed: true,
      isOwner: false,
    });
    expect(mockHasPermission).toHaveBeenCalledWith("users.manage");
  });

  it("refuses everyone else", async () => {
    await expect(assertCallerCanManageSchoolUsers(profile)).resolves.toEqual({
      allowed: false,
      isOwner: false,
      error: "Unauthorized",
    });
  });
});
