import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateBootstrapGuard } from "./validateBootstrapGuard";

describe("validateBootstrapGuard", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllEnvs();
  });

  it("returns null when no guards configured in development", () => {
    delete process.env.PLATFORM_BOOTSTRAP_SECRET;
    delete process.env.PLATFORM_OWNER_EMAIL;
    vi.stubEnv("NODE_ENV", "development");

    expect(validateBootstrapGuard("any@example.com", "any-secret")).toBeNull();
  });

  it("blocks open bootstrap in production when neither secret nor email is set", () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.PLATFORM_BOOTSTRAP_SECRET;
    delete process.env.PLATFORM_OWNER_EMAIL;

    expect(validateBootstrapGuard("any@example.com")).toBe("bootstrap-disabled-in-production");
  });

  it("validates bootstrap secret in constant time", () => {
    process.env.PLATFORM_BOOTSTRAP_SECRET = "super-secret-key-123";

    expect(validateBootstrapGuard("admin@example.com", undefined)).toBe("invalid-bootstrap-secret");
    expect(validateBootstrapGuard("admin@example.com", "wrong-secret")).toBe(
      "invalid-bootstrap-secret",
    );
    expect(validateBootstrapGuard("admin@example.com", "super-secret-key-123")).toBeNull();
  });

  it("validates allowed email case-insensitively in constant time", () => {
    process.env.PLATFORM_OWNER_EMAIL = "Owner@School.edu.kw";

    expect(validateBootstrapGuard(null)).toBe("unauthorized-bootstrap-identity");
    expect(validateBootstrapGuard("other@school.edu.kw")).toBe("unauthorized-bootstrap-identity");
    expect(validateBootstrapGuard("owner@school.edu.kw")).toBeNull();
    expect(validateBootstrapGuard("OWNER@SCHOOL.EDU.KW")).toBeNull();
  });
});
