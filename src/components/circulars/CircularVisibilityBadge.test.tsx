import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CircularVisibilityBadge } from "./CircularVisibilityBadge";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      visibilityBadgePublic: "عام",
      visibilityBadgeInternal: "داخلي",
    };
    return map[key] ?? key;
  },
}));

describe("CircularVisibilityBadge", () => {
  it("renders 'عام' when visibility is public", () => {
    render(<CircularVisibilityBadge visibility="public" />);
    expect(screen.getByText("عام")).toBeInTheDocument();
  });

  it("renders 'داخلي' when visibility is internal", () => {
    render(<CircularVisibilityBadge visibility="internal" />);
    expect(screen.getByText("داخلي")).toBeInTheDocument();
  });
});
