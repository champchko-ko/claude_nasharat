import { describe, it, expect, vi, beforeEach } from "vitest";
import { loginAction } from "./loginAction";
import { rateLimitBuckets } from "@/lib/rateLimit/rateLimitBuckets";

const mockSignInWithPassword = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: mockMaybeSingle,
        })),
      })),
    })),
  })),
}));

vi.mock("@/lib/security/resolveRequestIp", () => ({
  resolveRequestIp: vi.fn().mockResolvedValue("192.168.1.1"),
}));

describe("loginAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitBuckets.clear();
  });

  function makeFormData(email = "teacher@school.edu.kw", password = "password123") {
    const fd = new FormData();
    fd.set("email", email);
    fd.set("password", password);
    return fd;
  }

  it("returns invalid for malformed input", async () => {
    const fd = new FormData();
    fd.set("email", "not-an-email");
    fd.set("password", "short");

    const result = await loginAction({ ok: false, error: null }, fd);
    expect(result).toEqual({ ok: false, error: "invalid" });
  });

  it("returns ok: true when credentials and profile are active", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValueOnce({
      data: { is_active: true },
      error: null,
    });

    const result = await loginAction({ ok: false, error: null }, makeFormData());
    expect(result).toEqual({ ok: true, error: null });
  });

  it("signs out and returns disabled for inactive accounts", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValueOnce({
      data: { is_active: false },
      error: null,
    });

    const result = await loginAction({ ok: false, error: null }, makeFormData());
    expect(result).toEqual({ ok: false, error: "disabled" });
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("returns rate_limited when request limit is exceeded", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({
      data: { is_active: true },
      error: null,
    });

    for (let i = 0; i < 5; i++) {
      const res = await loginAction({ ok: false, error: null }, makeFormData());
      expect(res.ok).toBe(true);
    }

    // 6th attempt should be rate limited
    const result = await loginAction({ ok: false, error: null }, makeFormData());
    expect(result).toEqual({ ok: false, error: "rate_limited" });
  });
});
