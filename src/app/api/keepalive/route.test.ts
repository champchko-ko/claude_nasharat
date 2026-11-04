import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase", () => ({
  pingSupabaseDatabase: vi.fn().mockResolvedValue({
    success: true,
    latencyMs: 120,
    timestamp: "2026-10-25T00:00:00.000Z",
  }),
}));

import { GET } from "./route";
import * as routeModule from "./route";

describe("GET /api/keepalive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    delete process.env.CRON_SECRET;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 200 and success status on ping outside production", async () => {
    const req = new Request("http://localhost:3000/api/keepalive");
    const response = await GET(req);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.success).toBe(true);
    expect(body.latencyMs).toBe(120);
  });

  it("enforces CRON_SECRET when configured", async () => {
    vi.stubEnv("CRON_SECRET", "test-secret-123");

    const unauthReq = new Request("http://localhost:3000/api/keepalive");
    const unauthRes = await GET(unauthReq);
    expect(unauthRes.status).toBe(401);

    const wrongReq = new Request("http://localhost:3000/api/keepalive", {
      headers: { Authorization: "Bearer test-secret-124" },
    });
    expect((await GET(wrongReq)).status).toBe(401);

    const authReq = new Request("http://localhost:3000/api/keepalive", {
      headers: { Authorization: "Bearer test-secret-123" },
    });
    expect((await GET(authReq)).status).toBe(200);
  });

  it("fails closed in production when CRON_SECRET is not configured", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const req = new Request("http://localhost:3000/api/keepalive");
    const response = await GET(req);

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toMatch(/CRON_SECRET/);
  });

  it("does not expose a second unauthenticated verb", () => {
    expect(routeModule).not.toHaveProperty("POST");
  });
});
