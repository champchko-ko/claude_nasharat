import { describe, expect, it, vi, beforeEach } from "vitest";
import { updateSchoolAction } from "./updateSchoolAction";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/settings/revalidateSettingsPath", () => ({
  revalidateSettingsPath: vi.fn(),
}));

vi.mock("@/lib/auth/getCurrentProfile", () => ({
  getCurrentProfile: vi.fn(),
}));

vi.mock("@/lib/auth/isCurrentUserPlatformOwner", () => ({
  isCurrentUserPlatformOwner: vi.fn(),
}));

vi.mock("@/lib/school/getFirstActiveSchoolId", () => ({
  getFirstActiveSchoolId: vi.fn(),
}));

vi.mock("@/lib/rbac/hasPermission", () => ({
  hasPermission: vi.fn(),
}));

vi.mock("@/lib/school/uploadSchoolLogo", () => ({
  uploadSchoolLogo: vi.fn().mockResolvedValue({ path: null }),
}));

vi.mock("@/lib/school/persistSchoolProfile", () => ({
  persistSchoolProfile: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({}),
  createSupabaseAdminClient: vi.fn().mockReturnValue({}),
}));

import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { isCurrentUserPlatformOwner } from "@/lib/auth/isCurrentUserPlatformOwner";
import { getFirstActiveSchoolId } from "@/lib/school/getFirstActiveSchoolId";
import { hasPermission } from "@/lib/rbac/hasPermission";
import { persistSchoolProfile } from "@/lib/school/persistSchoolProfile";

describe("updateSchoolAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error if user is unauthenticated", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue(null);

    const formData = new FormData();
    formData.append("name_ar", "مدرسة");
    formData.append("name_en", "School");

    const result = await updateSchoolAction(formData);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/authenticated/i);
  });

  it("allows platform owner to update the singleton school", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue({
      id: "owner-1",
      full_name: "Owner",
      email: "owner@test.com",
      job_title: null,
      department_id: null,
      is_active: true,
    });
    vi.mocked(isCurrentUserPlatformOwner).mockResolvedValue(true);
    vi.mocked(getFirstActiveSchoolId).mockResolvedValue("school-active-1");

    const formData = new FormData();
    formData.append("name_ar", "مدرسة الفردوس");
    formData.append("name_en", "Al-Ferdous School");

    const result = await updateSchoolAction(formData);
    expect(result.success).toBe(true);
    expect(persistSchoolProfile).toHaveBeenCalledWith(
      expect.anything(),
      "school-active-1",
      expect.objectContaining({
        nameAr: "مدرسة الفردوس",
        nameEn: "Al-Ferdous School",
      }),
      null,
    );
  });

  it("rejects unauthorized non-owner", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue({
      id: "user-1",
      full_name: "Teacher",
      email: "teacher@test.com",
      job_title: null,
      department_id: null,
      is_active: true,
    });
    vi.mocked(isCurrentUserPlatformOwner).mockResolvedValue(false);
    vi.mocked(hasPermission).mockResolvedValue(false);

    const formData = new FormData();
    formData.append("name_ar", "مدرسة");
    formData.append("name_en", "School");

    const result = await updateSchoolAction(formData);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/unauthorized/i);
  });

  it("rejects non-owner trying to update another school", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue({
      id: "admin-1",
      full_name: "Admin",
      email: "admin@test.com",
      job_title: null,
      department_id: null,
      is_active: true,
    });
    vi.mocked(isCurrentUserPlatformOwner).mockResolvedValue(false);

    const formData = new FormData();
    formData.append("name_ar", "مدرسة");
    formData.append("name_en", "School");

    const result = await updateSchoolAction(formData);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/unauthorized/i);
  });

  it("rejects if Arabic or English name is missing", async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue({
      id: "admin-1",
      full_name: "Admin",
      email: "admin@test.com",
      job_title: null,
      department_id: null,
      is_active: true,
    });
    vi.mocked(isCurrentUserPlatformOwner).mockResolvedValue(false);
    vi.mocked(hasPermission).mockResolvedValue(true);

    const formData = new FormData();
    formData.append("name_ar", "مدرسة");
    formData.append("name_en", "");

    const result = await updateSchoolAction(formData);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/required/i);
  });
});
