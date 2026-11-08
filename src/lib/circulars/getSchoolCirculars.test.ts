import { describe, expect, it, vi } from "vitest";
import { getSchoolCirculars } from "./getSchoolCirculars";

const mockCirculars = [{ id: "c-1", title: "Test", visibility: "public" }];

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: mockCirculars, error: null }),
      }),
    }),
  }),
}));

describe("getSchoolCirculars", () => {
  it("returns empty array when schoolId is not provided", async () => {
    const result = await getSchoolCirculars(null);
    expect(result).toEqual([]);
  });

  it("returns circulars when query succeeds", async () => {
    const result = await getSchoolCirculars("school-1");
    expect(result).toHaveLength(1);
  });
});
