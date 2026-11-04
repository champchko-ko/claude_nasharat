import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CircularTargetBadges } from "./CircularTargetBadges";
import type { CircularRow } from "@/lib/circulars/types";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => (key === "allDepartments" ? "ALL" : key),
  useLocale: () => "en",
}));

describe("CircularTargetBadges", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders ALL badge when targets are empty or missing", () => {
    render(<CircularTargetBadges targets={[]} />);
    expect(screen.getByText("ALL")).toBeDefined();
  });

  it("renders ALL badge when targets count equals or exceeds totalDepartments", () => {
    const mockTargets: CircularRow["targets"] = [
      {
        id: "1",
        department_id: "d1",
        role_key: null,
        departments: { id: "d1", name_ar: "ط1", name_en: "D1" },
      },
      {
        id: "2",
        department_id: "d2",
        role_key: null,
        departments: { id: "d2", name_ar: "ط2", name_en: "D2" },
      },
      {
        id: "3",
        department_id: "d3",
        role_key: null,
        departments: { id: "d3", name_ar: "ط3", name_en: "D3" },
      },
    ];

    render(<CircularTargetBadges targets={mockTargets} totalDepartments={3} />);

    expect(screen.getByText("ALL")).toBeDefined();
    expect(screen.queryByText("D1")).toBeNull();
  });

  it("renders individual department badges when targets are a subset", () => {
    const mockTargets: CircularRow["targets"] = [
      {
        id: "1",
        department_id: "d1",
        role_key: null,
        departments: { id: "d1", name_ar: "ط1", name_en: "Science" },
      },
    ];

    render(<CircularTargetBadges targets={mockTargets} totalDepartments={4} />);

    expect(screen.getByText("Science")).toBeDefined();
    expect(screen.queryByText("ALL")).toBeNull();
  });
});
