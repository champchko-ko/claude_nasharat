import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardVisionMission } from "./DashboardVisionMission";
import type { SchoolFullDetails } from "@/lib/school/getSchoolFullDetails";

let mockLocale = "ar";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) =>
    key === "vision" ? "الرؤية" : key === "mission" ? "الرسالة" : key,
  useLocale: () => mockLocale,
}));

describe("DashboardVisionMission", () => {
  afterEach(() => {
    cleanup();
  });

  const baseSchool: SchoolFullDetails = {
    id: "school-1",
    name_ar: "مدرسة الأمل",
    name_en: "Al-Amal School",
    slug: "al-amal",
    timezone: "UTC",
    logo_path: null,
    is_active: true,
    vision_ar: "رؤية عربية متميزة",
    vision_en: "Distinguished English Vision",
    mission_ar: "رسالة عربية هادفة",
    mission_en: "Purposeful English Mission",
  };

  it("returns null when school is null or both vision and mission are absent", () => {
    const { container: c1 } = render(<DashboardVisionMission school={null} />);
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(
      <DashboardVisionMission
        school={{
          ...baseSchool,
          vision_ar: null,
          vision_en: null,
          mission_ar: null,
          mission_en: null,
        }}
      />,
    );
    expect(c2.firstChild).toBeNull();
  });

  it("renders Arabic vision and mission when locale is ar", () => {
    mockLocale = "ar";
    render(<DashboardVisionMission school={baseSchool} />);

    expect(screen.getByText("رؤية عربية متميزة")).toBeDefined();
    expect(screen.getByText("رسالة عربية هادفة")).toBeDefined();
    expect(screen.getByText("الرؤية")).toBeDefined();
    expect(screen.getByText("الرسالة")).toBeDefined();
  });

  it("renders English vision and mission when locale is en", () => {
    mockLocale = "en";
    render(<DashboardVisionMission school={baseSchool} />);

    expect(screen.getByText("Distinguished English Vision")).toBeDefined();
    expect(screen.getByText("Purposeful English Mission")).toBeDefined();
  });
});
