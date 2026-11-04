import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PublicInstagramLink } from "./PublicInstagramLink";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("PublicInstagramLink", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders with default fallback url when no url provided", () => {
    render(<PublicInstagramLink />);
    const link = screen.getByRole("link", { name: "instagramLabel" });
    expect(link).toHaveAttribute("href", "https://www.instagram.com/alfirdous_sc/");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders with custom url when provided", () => {
    render(<PublicInstagramLink url="https://instagram.com/custom_school" />);
    const link = screen.getByRole("link", { name: "instagramLabel" });
    expect(link).toHaveAttribute("href", "https://instagram.com/custom_school");
  });
});
