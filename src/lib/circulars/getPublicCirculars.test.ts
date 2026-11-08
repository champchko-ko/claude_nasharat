import { describe, it, expect, vi } from "vitest";
import { getPublicCirculars } from "./getPublicCirculars";

const mockCirculars = [
  {
    id: "circ-pub-1",
    ref_number: "CIR-2026-001",
    title: "Public Bulletin 1",
    body: "Details of public bulletin",
    priority: "normal",
    status: "published",
    visibility: "public",
  },
];

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: mockCirculars, error: null }),
        }),
      }),
    }),
  }),
}));

describe("getPublicCirculars", () => {
  it("returns empty array when schoolId is not provided", async () => {
    const res = await getPublicCirculars(null);
    expect(res).toEqual([]);
  });

  it("fetches published public circulars for the school", async () => {
    const res = await getPublicCirculars("school-1");
    expect(res).toHaveLength(1);
    expect(res[0].visibility).toBe("public");
    expect(res[0].status).toBe("published");
  });
});
