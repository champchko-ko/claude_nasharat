import { describe, it, expect, vi } from "vitest";
import { insertSchoolDocumentRecord } from "./insertSchoolDocumentRecord";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("insertSchoolDocumentRecord", () => {
  it("inserts document record with is_published = true", async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: () => ({
        single: () => Promise.resolve({ data: { id: "doc-1" }, error: null }),
      }),
    });

    const mockSupabase = {
      from: () => ({ insert: mockInsert }),
    } as unknown as SupabaseClient;

    const file = new File(["dummy content"], "test.pdf", { type: "application/pdf" });

    const id = await insertSchoolDocumentRecord(mockSupabase, {
      schoolId: "school-1",
      slug: "operational-plan",
      title: "Plan 2026",
      description: "Description",
      filePath: "school-1/operational-plan/test.pdf",
      file,
      profileId: "profile-1",
    });

    expect(id).toBe("doc-1");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        is_published: true,
        slug: "operational-plan",
      }),
    );
  });

  it("retries without is_published if column does not exist", async () => {
    let calls = 0;
    const mockInsert = vi.fn().mockImplementation(() => {
      calls++;
      if (calls === 1) {
        return {
          select: () => ({
            single: () =>
              Promise.resolve({
                data: null,
                error: { code: "42703", message: "column is_published does not exist" },
              }),
          }),
        };
      }
      return {
        select: () => ({
          single: () => Promise.resolve({ data: { id: "doc-legacy" }, error: null }),
        }),
      };
    });

    const mockSupabase = {
      from: () => ({ insert: mockInsert }),
    } as unknown as SupabaseClient;

    const file = new File(["dummy content"], "test.pdf", { type: "application/pdf" });

    const id = await insertSchoolDocumentRecord(mockSupabase, {
      schoolId: "school-1",
      slug: "committees-guide",
      title: "Guide",
      description: null,
      filePath: "school-1/committees-guide/test.pdf",
      file,
    });

    expect(id).toBe("doc-legacy");
    expect(calls).toBe(2);
  });
});
