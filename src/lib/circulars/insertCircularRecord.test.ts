import { describe, expect, it, vi } from "vitest";
import { insertCircularRecord } from "./insertCircularRecord";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

const params = {
  schoolId: "school-1",
  title: "Test",
  body: "Content",
  priority: "normal" as const,
  responseType: "acknowledgement" as const,
  dueAt: null,
  createdBy: "user-1",
};

describe("insertCircularRecord", () => {
  it("writes the requested visibility exactly once", async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: () => ({
        single: () => Promise.resolve({ data: { id: "circ-1" }, error: null }),
      }),
    });

    const mockSupabase = {
      from: () => ({ insert: mockInsert }),
    } as unknown as SupabaseClient;

    const res = await insertCircularRecord(
      mockSupabase,
      { ...params, visibility: "public" },
      "CIR-1",
    );

    expect(res.circularId).toBe("circ-1");
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert.mock.calls[0][0]).toMatchObject({
      visibility: "public",
      ref_number: "CIR-1",
      status: "draft",
    });
  });

  it("defaults to internal when no visibility is given", async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: () => ({
        single: () => Promise.resolve({ data: { id: "circ-2" }, error: null }),
      }),
    });

    const mockSupabase = {
      from: () => ({ insert: mockInsert }),
    } as unknown as SupabaseClient;

    await insertCircularRecord(mockSupabase, params, "CIR-2");

    expect(mockInsert.mock.calls[0][0]).toMatchObject({ visibility: "internal" });
  });

  it("reports a check constraint violation without rewriting the value", async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: () => ({
        single: () =>
          Promise.resolve({
            data: null,
            error: {
              code: "23514",
              message:
                'new row for relation "circulars" violates check constraint "circulars_visibility_check"',
            },
          }),
      }),
    });

    const mockSupabase = {
      from: () => ({ insert: mockInsert }),
    } as unknown as SupabaseClient;

    const res = await insertCircularRecord(
      mockSupabase,
      { ...params, visibility: "public" },
      "CIR-3",
    );

    expect(res.circularId).toBeUndefined();
    expect(res.error).toContain("circulars_visibility_check");
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });
});
