import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "./theme-toggle";

const { setTheme } = vi.hoisted(() => ({ setTheme: vi.fn() }));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "moe", setTheme }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("ThemeToggle", () => {
  afterEach(() => {
    cleanup();
    setTheme.mockClear();
  });

  it("renders the theme selector trigger button", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: "selectTheme" });
    expect(button).toBeDefined();
  });

  it("lists and applies the restored themes", () => {
    render(<ThemeToggle />);
    const trigger = screen.getByRole("button", { name: "selectTheme" });
    fireEvent.click(trigger);
    const darkOption = screen.getByText("dark");
    fireEvent.click(darkOption);
    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("lists and applies the MOE theme", () => {
    render(<ThemeToggle />);
    const trigger = screen.getByRole("button", { name: "selectTheme" });
    fireEvent.click(trigger);
    const moeOption = screen.getByText("moe");
    fireEvent.click(moeOption);
    expect(setTheme).toHaveBeenCalledWith("moe");
  });
});
