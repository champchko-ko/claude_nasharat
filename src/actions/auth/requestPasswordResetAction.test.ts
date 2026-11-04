import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { rateLimitBuckets } from "@/lib/rateLimit/rateLimitBuckets";

const { mockResetPasswordForEmail } = vi.hoisted(() => ({
  mockResetPasswordForEmail: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  }),
}));

vi.mock("@/lib/errors/sanitizeError", () => ({
  sanitizeError: vi.fn(),
}));

import { requestPasswordResetAction } from "./requestPasswordResetAction";

function stubEnv() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
  vi.stubEnv("APP_URL", "https://portal.example.edu");
  vi.stubEnv("SCHOOL_TIMEZONE", "Asia/Kuwait");
}

describe("requestPasswordResetAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitBuckets.clear();
    stubEnv();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns error on missing or invalid email format", async () => {
    const formData = new FormData();
    formData.append("email", "invalid-email");

    const result = await requestPasswordResetAction({ success: false }, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("invalid");
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("builds the reset link from APP_URL, not from request headers", async () => {
    mockResetPasswordForEmail.mockResolvedValueOnce({ error: null });

    const formData = new FormData();
    formData.append("email", "teacher@school.edu.kw");

    const result = await requestPasswordResetAction({ success: false }, formData);
    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith("teacher@school.edu.kw", {
      redirectTo: "https://portal.example.edu/api/auth/callback?next=/reset-password",
    });
  });

  it("normalises a trailing slash in APP_URL", async () => {
    vi.stubEnv("APP_URL", "https://portal.example.edu/");
    mockResetPasswordForEmail.mockResolvedValueOnce({ error: null });

    const formData = new FormData();
    formData.append("email", "teacher@school.edu.kw");

    await requestPasswordResetAction({ success: false }, formData);
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith("teacher@school.edu.kw", {
      redirectTo: "https://portal.example.edu/api/auth/callback?next=/reset-password",
    });
  });

  it("handles Supabase auth error gracefully", async () => {
    mockResetPasswordForEmail.mockResolvedValueOnce({ error: new Error("Rate limit exceeded") });

    const formData = new FormData();
    formData.append("email", "teacher@school.edu.kw");

    const result = await requestPasswordResetAction({ success: false }, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("failed");
  });

  it("returns rate_limited when request threshold is exceeded", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    const makeFormData = () => {
      const fd = new FormData();
      fd.append("email", "teacher@school.edu.kw");
      return fd;
    };

    for (let i = 0; i < 3; i++) {
      const res = await requestPasswordResetAction({ success: false }, makeFormData());
      expect(res.success).toBe(true);
    }

    const fourthResult = await requestPasswordResetAction({ success: false }, makeFormData());
    expect(fourthResult.success).toBe(false);
    expect(fourthResult.error).toBe("rate_limited");
  });
});
