import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockExchangeCodeForSession = vi.fn();

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn(() => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
    },
  })),
}));

vi.mock("@/lib/errors/sanitizeError", () => ({
  sanitizeError: vi.fn(),
}));

import { GET } from "./route";

describe("GET /api/auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exchanges code for session and redirects to next url", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: null });

    const req = new Request(
      "http://localhost:3000/api/auth/callback?code=valid-code&next=/ar/reset-password",
    );
    const res = await GET(req);

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("valid-code");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/ar/reset-password");
  });

  it.each([
    "//evil.example",
    "/\\evil.example",
    "https://evil.example",
    "javascript:alert(1)",
    "/ok\r\nSet-Cookie: x=1",
  ])("refuses to redirect to an off-site next value: %s", async (next) => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: null });

    const req = new Request(
      `http://localhost:3000/api/auth/callback?code=valid-code&next=${encodeURIComponent(next)}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it("redirects to login when code exchange fails", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: new Error("invalid code") });

    const req = new Request("http://localhost:3000/api/auth/callback?code=bad-code");
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/login?error=auth_callback_failed",
    );
  });

  it("redirects to login when no code is provided", async () => {
    const req = new Request("http://localhost:3000/api/auth/callback");
    const res = await GET(req);

    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/login?error=auth_callback_failed",
    );
  });
});
