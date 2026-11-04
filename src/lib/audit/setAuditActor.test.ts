import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

import { logError } from "@/lib/logger";
import { setAuditActor } from "./setAuditActor";

describe("setAuditActor", () => {
  const mockRpc = vi.fn();
  const mockClient = {
    rpc: mockRpc,
  } as unknown as SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls set_audit_actor RPC with actor id and label", async () => {
    mockRpc.mockResolvedValue({ error: null });

    await setAuditActor(mockClient, "user-123", "Alice (alice@school.org)");

    expect(mockRpc).toHaveBeenCalledWith("set_audit_actor", {
      p_actor_id: "user-123",
      p_actor_label: "Alice (alice@school.org)",
    });
  });

  it("defaults actor label to null if omitted", async () => {
    mockRpc.mockResolvedValue({ error: null });

    await setAuditActor(mockClient, "user-456");

    expect(mockRpc).toHaveBeenCalledWith("set_audit_actor", {
      p_actor_id: "user-456",
      p_actor_label: null,
    });
  });

  it("warns on error without throwing", async () => {
    const errorObj = { message: "Permission denied" };
    mockRpc.mockResolvedValue({ error: errorObj });

    await expect(setAuditActor(mockClient, "user-789")).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalledWith(errorObj, {
      scope: "setAuditActor",
      actorId: "user-789",
    });
  });
});
