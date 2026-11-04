import { describe, it, expect, afterEach, vi } from "vitest";
import { isStandaloneMode } from "./isStandaloneMode";

describe("isStandaloneMode", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("returns true when display-mode matches standalone", () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(display-mode: standalone)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    expect(isStandaloneMode()).toBe(true);
  });

  it("returns true when navigator.standalone is true (iOS standalone)", () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: "",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window.navigator, "standalone", {
      value: true,
      configurable: true,
      writable: true,
    });

    expect(isStandaloneMode()).toBe(true);
  });

  it("returns false when browser is standard tab mode", () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: "",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window.navigator, "standalone", {
      value: false,
      configurable: true,
      writable: true,
    });

    expect(isStandaloneMode()).toBe(false);
  });
});
