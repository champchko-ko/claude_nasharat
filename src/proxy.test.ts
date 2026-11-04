import { describe, it, expect, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/i18n", () => ({
  routing: { locales: ["ar", "en"], defaultLocale: "ar" },
}));

vi.mock("next-intl/middleware", () => ({
  default: () => (req: NextRequest) => {
    return NextResponse.next({
      request: {
        headers: req.headers,
      },
    });
  },
}));

vi.mock("@/lib/supabase/refreshSession", () => ({
  refreshSession: vi.fn((_req, res) => res),
}));

import proxy from "./proxy";

describe("proxy middleware", () => {
  it("sets Content-Security-Policy and x-nonce on request and response headers", async () => {
    const req = new NextRequest("http://localhost:3000/ar/dashboard");

    const res = await proxy(req);

    const cspHeader = res.headers.get("Content-Security-Policy");
    const nonceHeader = res.headers.get("x-nonce");

    expect(cspHeader).toBeDefined();
    expect(cspHeader).toContain("default-src 'self'");
    expect(nonceHeader).toBeDefined();
    expect(cspHeader).toContain(`'nonce-${nonceHeader}'`);
    expect(req.headers.get("x-nonce")).toBe(nonceHeader);
  });
});
