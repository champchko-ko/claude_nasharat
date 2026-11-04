import { describe, it, expect, vi } from "vitest";
import { getCurrentSchool } from "./getCurrentSchool";
import { createSupabaseServerClient } from "@/lib/supabase";
import { DatabaseError } from "@/lib/errors/DatabaseError";

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("./getFirstActiveSchoolId", () => ({
  getFirstActiveSchoolId: vi.fn().mockResolvedValue("s-fallback"),
}));

type MockServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

describe("getCurrentSchool", () => {
  it("returns null when no targetId is resolved", async () => {
    const school = await getCurrentSchool(null);
    expect(school).toBeNull();
  });

  it("throws DatabaseError when schools query fails", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "db down", code: "PGRST500" },
            }),
          }),
        }),
      }),
    } as unknown as MockServerClient);

    await expect(getCurrentSchool("s-1")).rejects.toThrow(DatabaseError);
  });

  it("throws DatabaseError when settings query fails", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "schools") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "s-1", name_ar: "مدرسة", name_en: "School" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "school_settings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: "settings query error", code: "PGRST501" },
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as unknown as MockServerClient);

    await expect(getCurrentSchool("s-1")).rejects.toThrow(DatabaseError);
  });

  it("returns school with academic year when both queries succeed", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "schools") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "s-1", name_ar: "مدرسة", name_en: "School" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "school_settings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { academic_year: "2026-2027" },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as unknown as MockServerClient);

    const school = await getCurrentSchool("s-1");
    expect(school).not.toBeNull();
    expect(school?.academic_year).toBe("2026-2027");
  });
});
