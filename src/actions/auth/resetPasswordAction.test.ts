import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockUpdateUser } = vi.hoisted(() => ({
  mockUpdateUser: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    auth: {
      updateUser: mockUpdateUser,
    },
  }),
}));

vi.mock("@/lib/errors/sanitizeError", () => ({
  sanitizeError: vi.fn(),
}));

vi.mock("@/lib/audit/recordCredentialAudit", () => ({
  recordCredentialAudit: vi.fn().mockResolvedValue(undefined),
}));

import { resetPasswordAction } from "./resetPasswordAction";
import { recordCredentialAudit } from "@/lib/audit/recordCredentialAudit";

describe("resetPasswordAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error if password is less than 6 characters", async () => {
    const formData = new FormData();
    formData.append("password", "short");
    formData.append("confirm_password", "short");

    const result = await resetPasswordAction({ success: false }, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("tooShort");
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("returns error if passwords do not match", async () => {
    const formData = new FormData();
    formData.append("password", "NewSecurePassword123!");
    formData.append("confirm_password", "DifferentPassword456!");

    const result = await resetPasswordAction({ success: false }, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("mismatch");
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("updates password successfully when inputs are valid and match", async () => {
    mockUpdateUser.mockResolvedValueOnce({
      data: { user: { id: "usr-1", email: "user@school.org" } },
      error: null,
    });

    const formData = new FormData();
    formData.append("password", "NewSecurePassword123!");
    formData.append("confirm_password", "NewSecurePassword123!");

    const result = await resetPasswordAction({ success: false }, formData);
    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: "NewSecurePassword123!" });
    expect(recordCredentialAudit).toHaveBeenCalledWith({
      actorId: "usr-1",
      actorLabel: "user@school.org",
      action: "credentials.password_change",
      entityId: "usr-1",
    });
  });

  it("handles Supabase auth error gracefully", async () => {
    mockUpdateUser.mockResolvedValueOnce({ error: new Error("Auth session missing") });

    const formData = new FormData();
    formData.append("password", "NewSecurePassword123!");
    formData.append("confirm_password", "NewSecurePassword123!");

    const result = await resetPasswordAction({ success: false }, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("failed");
  });
});
