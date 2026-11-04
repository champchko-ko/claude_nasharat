import { describe, expect, it } from "vitest";
import { constantTimeCompare } from "./constantTimeCompare";

describe("constantTimeCompare", () => {
  it("returns true for identical strings", () => {
    expect(constantTimeCompare("secret123", "secret123")).toBe(true);
  });

  it("returns false for different strings of same length", () => {
    expect(constantTimeCompare("secret123", "secret124")).toBe(false);
  });

  it("returns false for strings of different length", () => {
    expect(constantTimeCompare("secret123", "secret")).toBe(false);
    expect(constantTimeCompare("short", "much-longer-string")).toBe(false);
  });

  it("handles empty strings correctly", () => {
    expect(constantTimeCompare("", "")).toBe(true);
    expect(constantTimeCompare("", "a")).toBe(false);
  });
});
