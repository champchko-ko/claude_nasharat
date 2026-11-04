import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateDocumentReferenceNumber } from "./generateDocumentReferenceNumber";
import type { SupabaseClient } from "@supabase/supabase-js";

const { mockAdminRpc } = vi.hoisted(() => ({
  mockAdminRpc: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  createSupabaseAdminClient: () => ({
    rpc: (...args: unknown[]) => mockAdminRpc(...args),
  }),
}));

describe("generateDocumentReferenceNumber", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ref number when next_school_number succeeds", async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({ data: "CIR-2026-0001", error: null }),
    } as unknown as SupabaseClient;

    const res = await generateDocumentReferenceNumber(mockSupabase, "school-1", "circular");

    expect(res.refNum).toBe("CIR-2026-0001");
    expect(res.error).toBeUndefined();
  });

  it("falls back to generate_school_number when next_school_number is not in schema cache (PGRST202)", async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST202", message: "function not found" },
      }),
    } as unknown as SupabaseClient;

    mockAdminRpc.mockResolvedValue({ data: "CIR-2026-0002", error: null });

    const res = await generateDocumentReferenceNumber(mockSupabase, "school-1", "circular");

    expect(res.refNum).toBe("CIR-2026-0002");
    expect(mockAdminRpc).toHaveBeenCalledWith("generate_school_number", {
      p_school: "school-1",
      p_kind: "circular",
    });
  });

  it("falls back to generate_school_number when next_school_number returns 42501 (service role)", async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { code: "42501", message: "An active account is required to allocate a document number" },
      }),
    } as unknown as SupabaseClient;

    mockAdminRpc.mockResolvedValue({ data: "CIR-2026-0003", error: null });

    const res = await generateDocumentReferenceNumber(mockSupabase, "school-1", "circular");

    expect(res.refNum).toBe("CIR-2026-0003");
  });

  it("falls back to sequential timestamp format if both RPCs fail", async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST202", message: "function not found" },
      }),
    } as unknown as SupabaseClient;

    mockAdminRpc.mockResolvedValue({
      data: null,
      error: { message: "permission denied" },
    });

    const res = await generateDocumentReferenceNumber(mockSupabase, "school-1", "circular");

    expect(res.refNum).toMatch(/^CIR-\d{4}-\d{4}$/);
  });
});
