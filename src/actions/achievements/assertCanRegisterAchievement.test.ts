import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { assertCanRegisterAchievement } from "./assertCanRegisterAchievement";
import * as authModule from "@/lib/auth/isPlatformOwner";
import * as schoolModule from "@/lib/school/getCurrentSchool";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";

describe("assertCanRegisterAchievement", () => {
  it("throws ForbiddenError when profile is null", async () => {
    await expect(assertCanRegisterAchievement(null)).rejects.toThrow(ForbiddenError);
  });

  it("throws ForbiddenError when user is not a platform owner", async () => {
    vi.spyOn(schoolModule, "getCurrentSchool").mockResolvedValueOnce({
      id: "school-1",
      name_ar: "مدرسة",
      name_en: "School",
      slug: "school",
      timezone: "Asia/Kuwait",
      logo_path: null,
      is_active: true,
    });
    vi.spyOn(authModule, "isPlatformOwner").mockResolvedValueOnce(false);

    await expect(
      assertCanRegisterAchievement({ id: "staff-1", department_id: null }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("returns schoolId and profileId when user is platform owner", async () => {
    vi.spyOn(schoolModule, "getCurrentSchool").mockResolvedValueOnce({
      id: "school-fallback-1",
      name_ar: "مدرسة تجريبية",
      name_en: "Demo School",
      slug: "demo",
      timezone: "Asia/Kuwait",
      logo_path: null,
      is_active: true,
    });
    vi.spyOn(authModule, "isPlatformOwner").mockResolvedValueOnce(true);

    const result = await assertCanRegisterAchievement({
      id: "owner-1",
      department_id: null,
    });

    expect(result).toEqual({
      schoolId: "school-fallback-1",
      profileId: "owner-1",
    });
  });
});
