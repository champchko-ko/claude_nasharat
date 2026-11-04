import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn();
const mockFrom = vi.fn();
vi.mock("@/lib/supabase/createSupabaseAdminClient", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

import { logError } from "@/lib/logger";
import { recordCredentialAudit } from "./recordCredentialAudit";

describe("recordCredentialAudit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({ insert: mockInsert });
  });

  it("inserts an audit row for credential change", async () => {
    mockInsert.mockResolvedValue({ error: null });

    await recordCredentialAudit({
      schoolId: "school-1",
      actorId: "user-1",
      actorLabel: "Admin (admin@school.org)",
      action: "credentials.password_change",
      entityId: "user-1",
    });

    expect(mockFrom).toHaveBeenCalledWith("audit_logs");
    expect(mockInsert).toHaveBeenCalledWith({
      school_id: "school-1",
      actor_id: "user-1",
      actor_label: "Admin (admin@school.org)",
      action: "credentials.password_change",
      entity_type: "user",
      entity_id: "user-1",
      metadata: {},
    });
  });

  it("handles logging errors without throwing", async () => {
    const errorObj = { message: "DB write failed" };
    mockInsert.mockResolvedValue({ error: errorObj });

    await expect(
      recordCredentialAudit({
        actorId: "user-2",
        action: "credentials.password_reset",
        entityId: "user-2",
      }),
    ).resolves.toBeUndefined();

    expect(logError).toHaveBeenCalledWith(errorObj, {
      scope: "recordCredentialAudit",
      action: "credentials.password_reset",
      actorId: "user-2",
      entityId: "user-2",
    });
  });
});
