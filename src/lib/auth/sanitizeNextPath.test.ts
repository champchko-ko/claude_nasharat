import { describe, expect, it } from "vitest";
import { sanitizeNextPath } from "./sanitizeNextPath";

describe("sanitizeNextPath", () => {
  it("keeps a same-origin relative path", () => {
    expect(sanitizeNextPath("/ar/reset-password")).toBe("/ar/reset-password");
    expect(sanitizeNextPath("/settings/users?tab=roles")).toBe("/settings/users?tab=roles");
  });

  it.each([
    null,
    undefined,
    "",
    "dashboard",
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/a\\b",
    "javascript:alert(1)",
  ])("falls back to the dashboard for %s", (value) => {
    expect(sanitizeNextPath(value)).toBe("/dashboard");
  });

  it("rejects control characters used for header injection", () => {
    expect(sanitizeNextPath("/ok\r\nSet-Cookie: x=1")).toBe("/dashboard");
  });
});
