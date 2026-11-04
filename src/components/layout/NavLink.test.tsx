import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsIcon } from "lucide-react";
import { NavLink } from "./NavLink";

let currentPathname = "/settings/backup";

vi.mock("@/i18n", () => ({
  usePathname: () => currentPathname,
  Link: ({
    children,
    href,
    className,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  ),
}));

describe("NavLink", () => {
  afterEach(() => {
    cleanup();
  });

  it("does not activate when pathname matches excludedPrefixes", () => {
    currentPathname = "/settings/backup";

    render(
      <NavLink
        href="/settings"
        label="Settings"
        icon={SettingsIcon}
        excludedPrefixes={["/settings/backup"]}
      />,
    );

    const link = screen.getByRole("link", { name: "Settings" });
    expect(link.className).not.toContain("bg-sidebar-primary");
  });

  it("activates when pathname is under href and not excluded", () => {
    currentPathname = "/settings/school";

    render(
      <NavLink
        href="/settings"
        label="Settings"
        icon={SettingsIcon}
        excludedPrefixes={["/settings/backup"]}
      />,
    );

    const link = screen.getByRole("link", { name: "Settings" });
    expect(link.className).toContain("bg-sidebar-primary");
  });

  it("activates backup link when on /settings/backup", () => {
    currentPathname = "/settings/backup";

    render(<NavLink href="/settings/backup" label="Backup" icon={SettingsIcon} />);

    const link = screen.getByRole("link", { name: "Backup" });
    expect(link.className).toContain("bg-sidebar-primary");
  });
});
