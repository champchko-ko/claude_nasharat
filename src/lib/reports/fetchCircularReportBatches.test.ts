import { describe, it, expect, vi } from "vitest";
import { fetchCircularReportBatches } from "./fetchCircularReportBatches";
import { DatabaseError } from "@/lib/errors/DatabaseError";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("fetchCircularReportBatches", () => {
  it("returns empty arrays when circularIds is empty", async () => {
    const supabase = {} as SupabaseClient;
    const result = await fetchCircularReportBatches(supabase, []);
    expect(result).toEqual({ targets: [], responses: [] });
  });

  it("fetches targets and responses in batches of custom size", async () => {
    const inTargetsSpy = vi.fn().mockResolvedValue({
      data: [{ circular_id: "c1", department_id: "d1" }],
      error: null,
    });
    const inResponsesSpy = vi.fn().mockResolvedValue({
      data: [{ circular_id: "c1", department_id: "d1", status: "read" }],
      error: null,
    });

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "circular_targets") {
          return {
            select: vi.fn().mockReturnValue({ in: inTargetsSpy }),
          };
        }
        if (table === "circular_responses") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({ in: inResponsesSpy }),
            }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient;

    const result = await fetchCircularReportBatches(mockSupabase, ["c1", "c2", "c3"], 2);

    expect(result.targets).toHaveLength(2);
    expect(result.responses).toHaveLength(2);
    expect(inTargetsSpy).toHaveBeenCalledTimes(2);
    expect(inResponsesSpy).toHaveBeenCalledTimes(2);
  });

  it("throws DatabaseError when circular_responses query returns error", async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "circular_targets") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === "circular_responses") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: "db crash", code: "PGRST500" },
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient;

    await expect(fetchCircularReportBatches(mockSupabase, ["c1"])).rejects.toThrow(DatabaseError);
  });
});
