import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { verifyBypassToken } from "@/lib/security/verifyBypassToken";

describe("GET & POST /api/bypass", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 401 when UNDER_CONSTRUCTION_BYPASS_SECRET is not configured", async () => {
    delete process.env.UNDER_CONSTRUCTION_BYPASS_SECRET;
    const request = new NextRequest("http://localhost:3000/api/bypass?secret=mysecret");
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("returns 401 when secret does not match", async () => {
    process.env.UNDER_CONSTRUCTION_BYPASS_SECRET = "correct-secret";
    const request = new NextRequest("http://localhost:3000/api/bypass?secret=wrong-secret");
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("sets signed bypass cookie and redirects to root when secret matches", async () => {
    process.env.UNDER_CONSTRUCTION_BYPASS_SECRET = "correct-secret";
    const request = new NextRequest("http://localhost:3000/api/bypass?secret=correct-secret");
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
    const cookie = response.cookies.get("bypass_construction");
    expect(cookie?.value).toBeDefined();
    // Cookie value must NOT be the raw secret
    expect(cookie?.value).not.toBe("correct-secret");
    // Cookie value must verify as a signed token
    expect(verifyBypassToken(cookie?.value, "correct-secret")).toBe(true);
  });

  it("clears bypass cookie when clear parameter is passed", async () => {
    process.env.UNDER_CONSTRUCTION_BYPASS_SECRET = "correct-secret";
    const request = new NextRequest("http://localhost:3000/api/bypass?clear=1");
    const response = await GET(request);

    expect(response.status).toBe(307);
    const cookie = response.cookies.get("bypass_construction");
    expect(cookie?.value).toBe("");
  });

  it("accepts secret via POST JSON body", async () => {
    process.env.UNDER_CONSTRUCTION_BYPASS_SECRET = "correct-secret";
    const request = new NextRequest("http://localhost:3000/api/bypass", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret: "correct-secret" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(307);
    const cookie = response.cookies.get("bypass_construction");
    expect(cookie?.value).toBeDefined();
    expect(verifyBypassToken(cookie?.value, "correct-secret")).toBe(true);
  });
});
