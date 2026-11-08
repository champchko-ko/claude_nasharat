import { describe, expect, it, vi, beforeEach } from "vitest";
import { getPublicSchoolDocuments } from "./getPublicSchoolDocuments";

const mockSelect = vi.fn();
const mockEqSchool = vi.fn();
const mockOrder = vi.fn();

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      select: mockSelect.mockReturnValue({
        eq: mockEqSchool.mockReturnValue({ order: mockOrder }),
        order: mockOrder,
      }),
    })),
  })),
  createSupabaseAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    })),
  })),
}));

describe("getPublicSchoolDocuments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty array when schoolId is missing", async () => {
    const result = await getPublicSchoolDocuments(null);
    expect(result).toEqual([]);
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("queries published documents for the specified school and maps URLs", async () => {
    const fakeDocs = [
      {
        id: "doc-1",
        slug: "operational-plan",
        title: "Operational Plan 2026",
        description: "Plan details",
        file_path: "school-123/operational-plan/plan.pdf",
        file_name: "plan.pdf",
        file_size: 2048,
        mime_type: "application/pdf",
        status: "published",
        visibility: "public",
        created_by: "user-1",
        created_at: "2026-11-01T00:00:00Z",
        updated_at: "2026-11-01T00:00:00Z",
      },
    ];

    mockOrder.mockResolvedValueOnce({ data: fakeDocs, error: null });

    const result = await getPublicSchoolDocuments("school-123");

    expect(mockEqSchool).toHaveBeenCalledWith("status", "published");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(result).toHaveLength(1);
    expect(result[0]?.file_url).toBe("/api/documents/doc-1/preview");
  });

  it("returns an empty array when a database error occurs", async () => {
    mockOrder.mockResolvedValue({ data: null, error: new Error("DB failure") });

    const result = await getPublicSchoolDocuments("school-123");
    expect(result).toEqual([]);
  });
});
