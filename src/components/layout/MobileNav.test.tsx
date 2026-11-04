import React from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MobileNav } from "./MobileNav";
import type { SchoolRow } from "@/lib/school/getCurrentSchool";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      openMenu: "Open menu",
      closeMenu: "Close menu",
      portal: "School Portal",
      dashboard: "Dashboard",
      circulars: "Circulars",
      maintenance: "Maintenance",
      calendar: "Calendar",
      reports: "Reports",
      settings: "Settings",
    };
    return map[key] || key;
  },
  useLocale: () => "ar",
}));

vi.mock("@/i18n", () => ({
  usePathname: () => "/dashboard",
  Link: ({
    children,
    href,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
  }) => (
    <a href={href} onClick={onClick} {...props}>
      {children}
    </a>
  ),
}));

describe("MobileNav", () => {
  afterEach(() => {
    cleanup();
  });

  const mockSchool: SchoolRow = {
    id: "s1",
    name_ar: "دولة الكويت\nوزارة التربية\nمدرسة الأمل",
    name_en: "Al-Amal School",
    slug: "amal",
    timezone: "Asia/Kuwait",
    logo_path: null,
    academic_year: "2026/2027",
    is_active: true,
  };

  it("renders the burger menu button and opens drawer via portal on click", () => {
    render(
      <MobileNav
        school={mockSchool}
        isOwner={false}
        canManageSettings={true}
        canViewReports={true}
      />,
    );

    const openButton = screen.getByRole("button", { name: "Open menu" });
    expect(openButton).toBeDefined();

    // Drawer is closed initially
    expect(screen.queryByRole("dialog")).toBeNull();

    // Click to open
    fireEvent.click(openButton);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(screen.getByText("مدرسة الأمل")).toBeDefined();
    expect(screen.getByText("دولة الكويت • وزارة التربية")).toBeDefined();
    expect(screen.getByText("2026/2027")).toBeDefined();

    // Close on clicking close button
    const closeButton = screen.getByRole("button", { name: "Close menu" });
    fireEvent.click(closeButton);

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes the drawer when pressing Escape", () => {
    render(
      <MobileNav
        school={mockSchool}
        isOwner={false}
        canManageSettings={false}
        canViewReports={false}
      />,
    );

    const openButton = screen.getByRole("button", { name: "Open menu" });
    fireEvent.click(openButton);
    expect(screen.getByRole("dialog")).toBeDefined();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
