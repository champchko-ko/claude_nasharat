import { describe, it, expect, vi } from "vitest";
import { rollbackProvisionedUser } from "./rollbackProvisionedUser";

describe("rollbackProvisionedUser", () => {
  it("succeeds when both profile and auth user deletions succeed", async () => {
    const deleteProfileMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const deleteAuthUserMock = vi.fn().mockResolvedValue({ error: null });

    const admin = {
      from: vi.fn().mockReturnValue({ delete: deleteProfileMock }),
      auth: {
        admin: {
          deleteUser: deleteAuthUserMock,
        },
      },
    } as unknown as Parameters<typeof rollbackProvisionedUser>[0];

    await expect(rollbackProvisionedUser(admin, "user-123")).resolves.toBeUndefined();
    expect(deleteAuthUserMock).toHaveBeenCalledWith("user-123");
  });

  it("throws with userId when profile deletion fails", async () => {
    const deleteProfileMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: { message: "db timeout" } }),
    });
    const deleteAuthUserMock = vi.fn().mockResolvedValue({ error: null });

    const admin = {
      from: vi.fn().mockReturnValue({ delete: deleteProfileMock }),
      auth: {
        admin: {
          deleteUser: deleteAuthUserMock,
        },
      },
    } as unknown as Parameters<typeof rollbackProvisionedUser>[0];

    await expect(rollbackProvisionedUser(admin, "user-123")).rejects.toThrow(
      "Rollback failed for user user-123: profile delete failed: db timeout",
    );
  });

  it("throws with userId when auth user deletion fails", async () => {
    const deleteProfileMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const deleteAuthUserMock = vi.fn().mockResolvedValue({
      error: { message: "auth service unavailable" },
    });

    const admin = {
      from: vi.fn().mockReturnValue({ delete: deleteProfileMock }),
      auth: {
        admin: {
          deleteUser: deleteAuthUserMock,
        },
      },
    } as unknown as Parameters<typeof rollbackProvisionedUser>[0];

    await expect(rollbackProvisionedUser(admin, "user-123")).rejects.toThrow(
      "Rollback failed for user user-123: auth user delete failed: auth service unavailable",
    );
  });
});
