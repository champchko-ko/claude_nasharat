import { beforeEach, describe, expect, it, vi } from "vitest";
import { assertHealthCheckAuthorized } from "./assertHealthCheckAuthorized";

const mockIsCallerPlatformOwner = vi.fn();

vi.mock("./isCallerPlatformOwner", () => ({
  isCallerPlatformOwner: () => mockIsCallerPlatformOwner(),
}));

describe("assertHealthCheckAuthorized", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    mockIsCallerPlatformOwner.mockResolvedValue(false);
  });

  it("permits check in test/dev environment when no secret is configured", async () => {
    const req = new Request("http://localhost:3000/api/health?deep=1");
    const result = await assertHealthCheckAuthorized(req);

    expect(result.authorized).toBe(true);
    expect(result.status).toBe(200);
  });

  it("accepts valid Bearer token matching HEALTH_CHECK_SECRET", async () => {
    vi.stubEnv("HEALTH_CHECK_SECRET", "super-secret-health-token");

    const req = new Request("http://localhost:3000/api/health?deep=1", {
      headers: {
        authorization: "Bearer super-secret-health-token",
      },
    });

    const result = await assertHealthCheckAuthorized(req);
    expect(result.authorized).toBe(true);
    expect(result.status).toBe(200);
  });

  it("accepts valid Bearer token matching CRON_SECRET fallback", async () => {
    vi.stubEnv("CRON_SECRET", "cron-fallback-token");

    const req = new Request("http://localhost:3000/api/health?deep=1", {
      headers: {
        authorization: "Bearer cron-fallback-token",
      },
    });

    const result = await assertHealthCheckAuthorized(req);
    expect(result.authorized).toBe(true);
    expect(result.status).toBe(200);
  });

  it("rejects invalid Bearer token", async () => {
    vi.stubEnv("HEALTH_CHECK_SECRET", "super-secret-health-token");

    const req = new Request("http://localhost:3000/api/health?deep=1", {
      headers: {
        authorization: "Bearer wrong-token",
      },
    });

    const result = await assertHealthCheckAuthorized(req);
    expect(result.authorized).toBe(false);
    expect(result.status).toBe(401);
  });

  it("accepts authenticated platform owner", async () => {
    vi.stubEnv("HEALTH_CHECK_SECRET", "configured-secret");
    mockIsCallerPlatformOwner.mockResolvedValueOnce(true);

    const req = new Request("http://localhost:3000/api/health?deep=1");
    const result = await assertHealthCheckAuthorized(req);

    expect(result.authorized).toBe(true);
    expect(result.status).toBe(200);
  });

  it("fails closed in production with 503 if no secret is configured", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const req = new Request("http://localhost:3000/api/health?deep=1");
    const result = await assertHealthCheckAuthorized(req);

    expect(result.authorized).toBe(false);
    expect(result.status).toBe(503);
  });
});
