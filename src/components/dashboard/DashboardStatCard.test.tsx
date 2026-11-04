import { render, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FileTextIcon } from "lucide-react";
import { DashboardStatCard, type DashboardStatItem } from "./DashboardStatCard";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const item: DashboardStatItem = {
  title: "Active Circulars",
  count: 5,
  desc: "Circulars awaiting response",
  href: "/en/circulars",
  icon: FileTextIcon,
  accent: "text-info bg-info/10",
};

function getDiamond(container: HTMLElement): HTMLElement {
  const diamond = container.querySelector<HTMLElement>("[class*='rotate-45']");
  if (!diamond) throw new Error("diamond tile not found");
  return diamond;
}

describe("DashboardStatCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("fills the diamond with the solid brand blue, not the blue→navy gradient", () => {
    const { container } = render(<DashboardStatCard item={item} />);
    const diamond = getDiamond(container);

    expect(diamond.className).toContain("bg-[var(--action-from,#0b63d6)]");
    expect(diamond.className).not.toContain("linear-gradient");
  });

  it("renders the icon with no background of its own inside the diamond", () => {
    const { container } = render(<DashboardStatCard item={item} />);
    const diamond = getDiamond(container);
    const icon = diamond.querySelector("svg");

    expect(icon).not.toBeNull();
    expect(icon?.className.baseVal ?? "").not.toMatch(/(^|\s)bg-/);
    expect(diamond.children).toHaveLength(1);
    expect(diamond.querySelectorAll("[class*='bg-']")).toHaveLength(0);
  });
});
