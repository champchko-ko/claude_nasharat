import { describe, expect, it, vi, beforeEach } from "vitest";
import { getSchoolDocumentsBySlug } from "./getSchoolDocumentsBySlug";

const mockSelect = vi.fn();
const mockEqSchool = vi.fn();
const mockEqSlug = vi.fn();
const mockOrder = vi.fn();

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      select: mockSelect.mockReturnValue({
        eq: mockEqSchool.mockReturnValue({
          eq: mockEqSlug.mockReturnValue({
            order: mockOrder,
          }),
        }),
      }),
    })),
  })),
  createSupabaseAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    })),
  })),
}));

describe("getSchoolDocumentsBySlug", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when schoolId or slug is missing", async () => {
    expect(await getSchoolDocumentsBySlug(null, "operational-plan")).toEqual([]);
    expect(await getSchoolDocumentsBySlug("school-1", undefined)).toEqual([]);
  });

  it("fetches documents and maps properties correctly", async () => {
    mockOrder.mockResolvedValueOnce({
      data: [
        {
          id: "doc-1",
          school_id: "school-1",
          slug: "operational-plan",
          title: "Plan",
          description: "Desc",
          file_path: "path/to/file",
          file_name: "plan.pdf",
          file_size: 100,
          mime_type: "application/pdf",
          is_published: true,
          created_by: "user-1",
          created_at: "2026-11-01T00:00:00Z",
          updated_at: "2026-11-01T00:00:00Z",
          creator: { id: "user-1", full_name: "Manager" },
        },
      ],
      error: null,
    });

    const docs = await getSchoolDocumentsBySlug("school-1", "operational-plan");
    expect(docs).toHaveLength(1);
    expect(docs[0]?.title).toBe("Plan");
    expect(docs[0]?.file_url).toBe("/api/documents/doc-1/preview");
    expect(docs[0]?.creator?.full_name).toBe("Manager");
  });
});
