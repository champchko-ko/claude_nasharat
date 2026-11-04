import React from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SchoolProfileForm } from "./SchoolProfileForm";
import type { SchoolFullDetails } from "@/lib/school/getSchoolFullDetails";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      identity: "Basic Identity",
      leadership: "School Leadership",
      contactAndLocation: "Contact & Location",
      logo: "School Logo",
      operationalSettings: "Operations & Schedule",
      visionAndMission: "Vision & Mission",
      school: "School Profile",
      schoolDesc: "School description",
      nameAr: "School Name (Arabic)",
      nameEn: "School Name (English)",
      slug: "Slug",
      academicYear: "Academic Year",
      saveSchool: "Save Changes",
      saved: "Saved",
      saving: "Saving...",
    };
    return map[key] || key;
  },
}));

vi.mock("@/i18n", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/actions/settings/updateSchoolAction", () => ({
  updateSchoolAction: vi.fn().mockResolvedValue({ success: true }),
}));

describe("SchoolProfileForm", () => {
  afterEach(() => {
    cleanup();
  });

  const mockSchool: SchoolFullDetails = {
    id: "s1",
    name_ar: "مدرسة الأمل",
    name_en: "Al-Amal School",
    slug: "al-amal",
    timezone: "Asia/Kuwait",
    logo_path: null,
    academic_year: "2026/2027",
    is_active: true,
    phone: null,
    email: null,
    manager_name_ar: null,
    manager_name_en: null,
    assistant_manager_ar: null,
    assistant_manager_en: null,
    assistant_manager_2_ar: null,
    assistant_manager_2_en: null,
    address_ar: null,
    address_en: null,
    vision: null,
    vision_ar: null,
    vision_en: null,
    mission: null,
    mission_ar: null,
    mission_en: null,
    working_days: [0, 1, 2, 3, 4],
    date_format: "yyyy-MM-dd",
  };

  it("renders with identity tab active by default and switches to other tabs", () => {
    render(<SchoolProfileForm school={mockSchool} canManage={true} />);

    // Default tab is identity
    const identityPanel = document.getElementById("panel-identity");
    expect(identityPanel?.className).toContain("block");

    const leadershipPanel = document.getElementById("panel-leadership");
    expect(leadershipPanel?.className).toContain("hidden");

    // Click leadership tab
    const leadershipTab = screen.getByRole("tab", { name: /School Leadership/i });
    fireEvent.click(leadershipTab);

    expect(leadershipPanel?.className).toContain("block");
    expect(identityPanel?.className).toContain("hidden");
  });
});
