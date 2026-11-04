import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicFooter } from "./PublicFooter";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    if (key === "title") return "بوابة إدارة المدرسة";
    if (key === "navOverview") return "Overview";
    return key;
  },
}));

describe("PublicFooter", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the copyright text centered in the page", () => {
    render(<PublicFooter />);

    const copyrightEl = screen.getByText(/بوابة إدارة المدرسة/);
    expect(copyrightEl).toBeDefined();

    const parentParagraph = copyrightEl.closest("p");
    expect(parentParagraph?.className).toContain("text-center");
  });
});
