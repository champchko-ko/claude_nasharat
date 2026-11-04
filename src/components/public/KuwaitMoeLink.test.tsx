import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { KuwaitMoeLink } from "./KuwaitMoeLink";

describe("KuwaitMoeLink", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders with correct MOE url and security attributes", () => {
    render(<KuwaitMoeLink />);
    const link = screen.getByRole("link", {
      name: "وزارة التربية - دولة الكويت | Ministry of Education",
    });
    expect(link).toHaveAttribute("href", "https://www.moe.edu.kw/");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders Kuwait emblem image on the right of the text (dir=ltr)", () => {
    render(<KuwaitMoeLink />);
    const link = screen.getByRole("link", {
      name: "وزارة التربية - دولة الكويت | Ministry of Education",
    });
    expect(link).toHaveAttribute("dir", "ltr");
    const img = screen.getByAltText("شعار دولة الكويت - وزارة التربية");
    expect(img).toHaveAttribute("src", "/images/kuwait-emblem.svg");
    expect(screen.getByText("وزارة التربية")).toBeInTheDocument();
    expect(screen.getByText("Ministry of Education")).toBeInTheDocument();
    expect(screen.getByText("State of Kuwait | دولة الكويت")).toBeInTheDocument();
  });
});
