import { describe, expect, it, vi, beforeEach } from "vitest";
import { assertCanUpdateSchoolSettings } from "./assertCanUpdateSchoolSettings";

vi.mock("@/lib/auth/isCurrentUserPlatformOwner", () => ({
  isCurrentUserPlatformOwner: vi.fn(),
}));

vi.mock("@/lib/school/getFirstActiveSchoolId", () => ({
  getFirstActiveSchoolId: vi.fn(),
}));

vi.mock("@/lib/rbac/hasPermission", () => ({
  hasPermission: vi.fn(),
}));

import { isCurrentUserPlatformOwner } from "@/lib/auth/isCurrentUserPlatformOwner";
import { getFirstActiveSchoolId } from "@/lib/school/getFirstActiveSchoolId";
import { hasPermission } from "@/lib/rbac/hasPermission";
import type { ProfileRow } from "@/lib/auth/getCurrentProfile";

describe("assertCanUpdateSchoolSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseProfile: ProfileRow = {
    id: "usr-1",
    full_name: "Test User",
    email: "test@local.test",
    job_title: null,
    department_id: null,
    is_active: true,
  };

  it("allows platform owner and returns resolved school id", async () => {
    vi.mocked(isCurrentUserPlatformOwner).mockResolvedValue(true);
    const targetId = await assertCanUpdateSchoolSettings(baseProfile, null);
    expect(targetId).toBe("sch-1");
  });

  it("resolves the singleton school for the owner", async () => {
    vi.mocked(isCurrentUserPlatformOwner).mockResolvedValue(true);
    vi.mocked(getFirstActiveSchoolId).mockResolvedValue("sch-first");
    const targetId = await assertCanUpdateSchoolSettings(baseProfile, null);
    expect(targetId).toBe("sch-first");
  });

  it("throws ValidationError when no target school can be resolved", async () => {
    vi.mocked(isCurrentUserPlatformOwner).mockResolvedValue(false);
    vi.mocked(getFirstActiveSchoolId).mockResolvedValue(null);

    await expect(
      assertCanUpdateSchoolSettings(baseProfile, null),
    ).rejects.toThrow(/No target school specified/);
  });

  it("uses the singleton school for a non-owner", async () => {
    vi.mocked(isCurrentUserPlatformOwner).mockResolvedValue(false);

    await expect(assertCanUpdateSchoolSettings(baseProfile, "sch-diff")).rejects.toThrow(
      /Cannot manage a different school/,
    );
  });

  it("throws ForbiddenError when user lacks settings.school.update permission", async () => {
    vi.mocked(isCurrentUserPlatformOwner).mockResolvedValue(false);
    vi.mocked(hasPermission).mockResolvedValue(false);

    await expect(assertCanUpdateSchoolSettings(baseProfile, "sch-1")).rejects.toThrow(
      /Unauthorized/,
    );
  });

  it("returns school id when non-owner has settings.school.update permission", async () => {
    vi.mocked(isCurrentUserPlatformOwner).mockResolvedValue(false);
    vi.mocked(hasPermission).mockResolvedValue(true);

    const targetId = await assertCanUpdateSchoolSettings(baseProfile, "sch-1");
    expect(targetId).toBe("sch-1");
  });
});
