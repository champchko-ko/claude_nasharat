import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppHeaderGreeting } from "./AppHeaderGreeting";
import type { ProfileRow } from "@/lib/auth/getCurrentProfile";
import type { SchoolRow } from "@/lib/school/getCurrentSchool";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: { name?: string }) => {
    if (key === "welcome") return `مرحباً، ${values?.name ?? ""}`;
    return key;
  },
  useLocale: () => "ar",
}));

describe("AppHeaderGreeting", () => {
  afterEach(() => {
    cleanup();
  });

  const mockProfile: ProfileRow = {
    id: "u1",
    full_name: "elnewahy",
    email: "test@example.com",
    department_id: "dept-1",
    department_name_ar: "قسم العلوم",
    department_name_en: "Science Dept",
    role_id: "r1",
    status: "active",
    created_at: new Date().toISOString(),
    departments: { name_ar: "قسم العلوم", name_en: "Science Dept" },
  } as unknown as ProfileRow;

  const mockSchool: SchoolRow = {
    id: "s1",
    name_ar: "مدرسة الأمل",
    name_en: "Al-Amal School",
    slug: "amal",
    timezone: "Asia/Kuwait",
    logo_path: null,
    academic_year: "2026/2027",
    is_active: true,
  };

  it("renders the welcome greeting, academic year, and department with human typography", () => {
    render(<AppHeaderGreeting profile={mockProfile} school={mockSchool} />);

    expect(screen.getByText("مرحباً، elnewahy")).toBeDefined();
    expect(screen.getByText("2026/2027")).toBeDefined();
    expect(screen.getByText("قسم العلوم")).toBeDefined();
  });
});
