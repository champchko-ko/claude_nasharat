import React from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SchoolProfileSubTabs } from "./SchoolProfileSubTabs";

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
    };
    return map[key] || key;
  },
}));

describe("SchoolProfileSubTabs", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders all 6 sub-tabs with correct labels and highlights active tab", () => {
    const onTabChange = vi.fn();
    const { rerender } = render(
      <SchoolProfileSubTabs activeTab="identity" onTabChange={onTabChange} />,
    );

    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBe(6);

    const identityTab = screen.getByRole("tab", { name: /Basic Identity/i });
    expect(identityTab.getAttribute("aria-selected")).toBe("true");

    const leadershipTab = screen.getByRole("tab", { name: /School Leadership/i });
    expect(leadershipTab.getAttribute("aria-selected")).toBe("false");

    fireEvent.click(leadershipTab);
    expect(onTabChange).toHaveBeenCalledWith("leadership");

    rerender(<SchoolProfileSubTabs activeTab="leadership" onTabChange={onTabChange} />);
    expect(leadershipTab.getAttribute("aria-selected")).toBe("true");
  });
});
