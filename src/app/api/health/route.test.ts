import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const { mockPing } = vi.hoisted(() => ({ mockPing: vi.fn() }));

vi.mock("@/lib/supabase", () => ({ pingSupabaseDatabase: mockPing }));

import { GET } from "./route";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("GIT_COMMIT_SHA", "abc1234");
  });

  it("answers liveness without touching the database", async () => {
    const response = await GET(new Request("http://localhost:3000/api/health"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok",
      version: "abc1234",
      database: "not-checked",
    });
    expect(mockPing).not.toHaveBeenCalled();
  });

  it("reports the database as reachable with ?deep=1", async () => {
    mockPing.mockResolvedValueOnce({
      success: true,
      latencyMs: 7,
      timestamp: "2026-10-28T00:00:00.000Z",
    });

    const response = await GET(new Request("http://localhost:3000/api/health?deep=1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ status: "ok", version: "abc1234", database: "ok", latencyMs: 7 });
  });

  it("returns 503 when the deep check cannot reach the database", async () => {
    mockPing.mockResolvedValueOnce({
      success: false,
      latencyMs: 900,
      timestamp: "2026-10-28T00:00:00.000Z",
    });

    const response = await GET(new Request("http://localhost:3000/api/health?deep=1"));

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ status: "degraded", database: "unreachable" });
  });

  it("rejects unauthorized deep health checks when secret is configured", async () => {
    vi.stubEnv("HEALTH_CHECK_SECRET", "super-secret");

    const response = await GET(new Request("http://localhost:3000/api/health?deep=1"));

    expect(response.status).toBe(401);
    expect(mockPing).not.toHaveBeenCalled();
  });

  it("permits authorized deep health checks with matching Bearer token", async () => {
    vi.stubEnv("HEALTH_CHECK_SECRET", "super-secret");
    mockPing.mockResolvedValueOnce({
      success: true,
      latencyMs: 5,
      timestamp: "2026-10-28T00:00:00.000Z",
    });

    const response = await GET(
      new Request("http://localhost:3000/api/health?deep=1", {
        headers: { authorization: "Bearer super-secret" },
      }),
    );

    expect(response.status).toBe(200);
    expect(mockPing).toHaveBeenCalledTimes(1);
  });

  it("says the version is unknown instead of inventing one", async () => {
    vi.unstubAllEnvs();

    const response = await GET(new Request("http://localhost:3000/api/health"));

    expect(await response.json()).toMatchObject({ version: "unknown" });
  });
});
