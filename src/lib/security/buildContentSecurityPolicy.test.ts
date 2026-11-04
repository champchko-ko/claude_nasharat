import { describe, it, expect } from "vitest";
import { buildContentSecurityPolicy } from "./buildContentSecurityPolicy";

describe("buildContentSecurityPolicy", () => {
  it("generates a random base64 nonce when none is provided", () => {
    const { nonce, headerValue } = buildContentSecurityPolicy();
    expect(nonce).toBeDefined();
    expect(nonce.length).toBeGreaterThan(10);
    expect(headerValue).toContain(`'nonce-${nonce}'`);
  });

  it("uses provided custom nonce", () => {
    const { nonce, headerValue } = buildContentSecurityPolicy("test-nonce-123");
    expect(nonce).toBe("test-nonce-123");
    expect(headerValue).toContain("'nonce-test-nonce-123'");
  });

  it("includes unsafe-eval in development mode", () => {
    const { headerValue } = buildContentSecurityPolicy("test-nonce", { isDev: true });
    expect(headerValue).toContain("'unsafe-eval'");
    expect(headerValue).not.toContain("upgrade-insecure-requests");
  });

  it("excludes unsafe-eval and includes upgrade-insecure-requests in production mode", () => {
    const { headerValue } = buildContentSecurityPolicy("test-nonce", { isDev: false });
    expect(headerValue).not.toContain("'unsafe-eval'");
    expect(headerValue).toContain("upgrade-insecure-requests");
  });

  it("includes supabase origins in connect-src and img-src", () => {
    const { headerValue } = buildContentSecurityPolicy("test-nonce", {
      supabaseUrl: "http://127.0.0.1:54321",
    });
    expect(headerValue).toContain("http://127.0.0.1:54321");
  });

  it("includes error reporting origin in connect-src", () => {
    const { headerValue } = buildContentSecurityPolicy("test-nonce", {
      errorReportingUrl: "https://errors.example.com/api/report",
    });
    expect(headerValue).toContain("https://errors.example.com");
  });
});
