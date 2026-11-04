import { describe, expect, it } from "vitest";
import { isNextRouterError } from "./isNextRouterError";

describe("isNextRouterError", () => {
  it("returns true for NEXT_REDIRECT digest", () => {
    const error = { digest: "NEXT_REDIRECT;replace;/dashboard;307;" };
    expect(isNextRouterError(error)).toBe(true);
  });

  it("returns true for NEXT_NOT_FOUND digest", () => {
    const error = { digest: "NEXT_NOT_FOUND" };
    expect(isNextRouterError(error)).toBe(true);
  });

  it("returns false for non-digest errors", () => {
    expect(isNextRouterError(new Error("Standard error"))).toBe(false);
    expect(isNextRouterError(null)).toBe(false);
    expect(isNextRouterError("some string")).toBe(false);
    expect(isNextRouterError({ digest: 123 })).toBe(false);
  });
});
