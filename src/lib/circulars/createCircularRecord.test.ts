import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCircularRecord } from "./createCircularRecord";
import type { SupabaseClient } from "@supabase/supabase-js";

const { mockGenerateRef } = vi.hoisted(() => ({
  mockGenerateRef: vi.fn(),
}));

vi.mock("@/lib/school/generateDocumentReferenceNumber", () => ({
  generateDocumentReferenceNumber: (...args: unknown[]) => mockGenerateRef(...args),
}));

describe("createCircularRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates circular record successfully", async () => {
    mockGenerateRef.mockResolvedValue({ refNum: "CIR-2026-0001" });

    const mockInsert = vi.fn().mockReturnValue({
      select: () => ({
        single: () => Promise.resolve({ data: { id: "circ-1" }, error: null }),
      }),
    });

    const mockSupabase = {
      from: () => ({ insert: mockInsert }),
    } as unknown as SupabaseClient;

    const res = await createCircularRecord(mockSupabase, {
      schoolId: "school-1",
      title: "Test",
      body: "Content",
      priority: "normal",
      visibility: "internal",
      responseType: "acknowledgement",
      dueAt: null,
      createdBy: "user-1",
    });

    expect(res.circularId).toBe("circ-1");
  });

  it("handles reference number failure", async () => {
    mockGenerateRef.mockResolvedValue({ error: "Failed to generate" });

    const mockSupabase = {} as unknown as SupabaseClient;

    const res = await createCircularRecord(mockSupabase, {
      schoolId: "school-1",
      title: "Test",
      body: "Content",
      priority: "normal",
      responseType: "acknowledgement",
      dueAt: null,
      createdBy: "user-1",
    });

    expect(res.error).toBe("Failed to generate");
  });

  it("surfaces a visibility constraint violation instead of rewriting it", async () => {
    mockGenerateRef.mockResolvedValue({ refNum: "CIR-2026-0001" });

    const mockInsert = vi.fn().mockReturnValue({
      select: () => ({
        single: () =>
          Promise.resolve({
            data: null,
            error: {
              code: "23514",
              message: 'violates check constraint "circulars_visibility_check"',
            },
          }),
      }),
    });

    const mockSupabase = {
      from: () => ({ insert: mockInsert }),
    } as unknown as SupabaseClient;

    const res = await createCircularRecord(mockSupabase, {
      schoolId: "school-1",
      title: "Public Circular",
      body: "Content",
      priority: "normal",
      visibility: "public",
      responseType: "acknowledgement",
      dueAt: null,
      createdBy: "user-1",
    });

    // The failure is reported, and the row is written exactly once: no second
    // attempt with a different visibility value.
    expect(res.circularId).toBeUndefined();
    expect(res.error).toContain("circulars_visibility_check");
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert.mock.calls[0][0]).toMatchObject({ visibility: "public" });
  });
});
