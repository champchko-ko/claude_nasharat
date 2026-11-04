import { describe, it, expect } from "vitest";
import { resolveSafeOrigin } from "./resolveSafeOrigin";

describe("resolveSafeOrigin", () => {
  it("returns null for undefined, null, or empty string", () => {
    expect(resolveSafeOrigin(undefined)).toBeNull();
    expect(resolveSafeOrigin(null)).toBeNull();
    expect(resolveSafeOrigin("")).toBeNull();
  });

  it("returns origin for valid URLs", () => {
    expect(resolveSafeOrigin("https://example.com/api/test")).toBe("https://example.com");
    expect(resolveSafeOrigin("http://127.0.0.1:54321/storage")).toBe("http://127.0.0.1:54321");
  });

  it("returns null for invalid URLs without throwing", () => {
    expect(resolveSafeOrigin("not a url")).toBeNull();
  });
});
