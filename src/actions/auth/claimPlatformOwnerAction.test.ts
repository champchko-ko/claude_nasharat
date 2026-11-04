import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { rateLimitBuckets } from "@/lib/rateLimit/rateLimitBuckets";

vi.mock("server-only", () => ({}));

const mockGetUser = vi.fn();
const mockHasAnyPlatformOwner = vi.fn();
const mockBootstrapPlatformOwnerClaim = vi.fn();

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
  createSupabaseAdminClient: vi.fn(() => ({})),
}));

vi.mock("@/lib/auth/hasAnyPlatformOwner", () => ({
  hasAnyPlatformOwner: () => mockHasAnyPlatformOwner(),
}));

vi.mock("./bootstrapPlatformOwnerClaim", () => ({
  bootstrapPlatformOwnerClaim: (...args: unknown[]) => mockBootstrapPlatformOwnerClaim(...args),
}));

import { claimPlatformOwnerAction } from "./claimPlatformOwnerAction";

describe("claimPlatformOwnerAction", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitBuckets.clear();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllEnvs();
  });

  it("returns unauthenticated if no user session exists", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const result = await claimPlatformOwnerAction();
    expect(result).toEqual({ ok: false, error: "unauthenticated" });
  });

  it("rejects open bootstrap in production when no secret or allowlisted email is set", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.PLATFORM_BOOTSTRAP_SECRET;
    delete process.env.PLATFORM_OWNER_EMAIL;
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1", email: "attacker@test.com" } } });

    const result = await claimPlatformOwnerAction();
    expect(result).toEqual({ ok: false, error: "bootstrap-disabled-in-production" });
  });

  it("enforces PLATFORM_BOOTSTRAP_SECRET when configured", async () => {
    process.env.PLATFORM_BOOTSTRAP_SECRET = "super-secret-token-123";
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1", email: "admin@school.com" } } });

    const badResult = await claimPlatformOwnerAction("wrong-token");
    expect(badResult).toEqual({ ok: false, error: "invalid-bootstrap-secret" });

    mockHasAnyPlatformOwner.mockResolvedValue(false);
    mockBootstrapPlatformOwnerClaim.mockResolvedValue({ ok: true, error: null });

    const goodResult = await claimPlatformOwnerAction("super-secret-token-123");
    expect(goodResult).toEqual({ ok: true, error: null });
  });

  it("enforces PLATFORM_OWNER_EMAIL allowlist when configured", async () => {
    process.env.PLATFORM_OWNER_EMAIL = "director@ministry.edu";
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1", email: "stranger@other.com" } } });

    const rejected = await claimPlatformOwnerAction();
    expect(rejected).toEqual({ ok: false, error: "unauthorized-bootstrap-identity" });

    mockGetUser.mockResolvedValue({
      data: { user: { id: "u-1", email: "DIRECTOR@MINISTRY.EDU" } },
    });
    mockHasAnyPlatformOwner.mockResolvedValue(false);
    mockBootstrapPlatformOwnerClaim.mockResolvedValue({ ok: true, error: null });

    const allowed = await claimPlatformOwnerAction();
    expect(allowed).toEqual({ ok: true, error: null });
  });

  it("rejects claim when platform owner already exists", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1", email: "admin@school.com" } } });
    mockHasAnyPlatformOwner.mockResolvedValue(true);

    const result = await claimPlatformOwnerAction();
    expect(result).toEqual({ ok: false, error: "owner-exists" });
  });

  it("returns rate_limited when owner claim attempts exceed threshold", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-flood", email: "admin@school.com" } } });
    mockHasAnyPlatformOwner.mockResolvedValue(true);

    for (let i = 0; i < 5; i++) {
      const res = await claimPlatformOwnerAction();
      expect(res.error).toBe("owner-exists");
    }

    const sixth = await claimPlatformOwnerAction();
    expect(sixth).toEqual({ ok: false, error: "rate_limited" });
  });
});
