import { describe, expect, it } from "vitest";
import { resolveNarrativePair } from "./resolveNarrativePair";

describe("resolveNarrativePair", () => {
  it("prefers localized value if present", () => {
    expect(resolveNarrativePair("Arabic Vision", "Legacy Vision")).toBe("Arabic Vision");
  });

  it("falls back to legacy value if localized is empty or null", () => {
    expect(resolveNarrativePair("", "Legacy Vision")).toBe("Legacy Vision");
    expect(resolveNarrativePair(null, "Legacy Vision")).toBe("Legacy Vision");
  });

  it("returns null when both are falsy", () => {
    expect(resolveNarrativePair(null, null)).toBeNull();
  });
});
