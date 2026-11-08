import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAssertAuth, mockFrom, mockStorageRemove } = vi.hoisted(() => ({
  mockAssertAuth: vi.fn(),
  mockFrom: vi.fn(),
  mockStorageRemove: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/documents/assertCanManageDocuments", () => ({
  assertCanManageDocuments: () => mockAssertAuth(),
}));

vi.mock("@/lib/supabase", () => ({
  createSupabaseAdminClient: vi.fn().mockReturnValue({
    from: (...args: unknown[]) => mockFrom(...args),
    storage: {
      from: () => ({
        remove: (...args: unknown[]) => mockStorageRemove(...args),
      }),
    },
  }),
}));

import { deleteSchoolDocumentAction } from "./deleteSchoolDocumentAction";

describe("deleteSchoolDocumentAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails if unauthorized", async () => {
    mockAssertAuth.mockResolvedValueOnce({ allowed: false });

    const res = await deleteSchoolDocumentAction("doc-123");

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe("Unauthorized to manage school documents");
    }
  });

  it("fails if document is not found", async () => {
    mockAssertAuth.mockResolvedValueOnce({
      allowed: true,
      schoolId: "school-123",
    });

    const mockSingle = vi.fn().mockResolvedValueOnce({
      data: null,
      error: { message: "Not found" },
    });
    const mockEqSchool = vi.fn().mockReturnValue({ single: mockSingle });
    const mockEqId = vi.fn().mockReturnValue({ eq: mockEqSchool });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqId });

    mockFrom.mockReturnValue({ select: mockSelect });

    const res = await deleteSchoolDocumentAction("doc-123");

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe("Document not found");
    }
  });

  it("deletes document record and storage file successfully", async () => {
    mockAssertAuth.mockResolvedValueOnce({
      allowed: true,
      schoolId: "school-123",
    });

    const mockSingle = vi.fn().mockResolvedValueOnce({
      data: {
        id: "doc-123",
        slug: "operational-plan",
        file_path: "school-123/operational-plan/plan.pdf",
      },
      error: null,
    });
    const mockEqSchool = vi.fn().mockReturnValue({ single: mockSingle });
    const mockEqId = vi.fn().mockReturnValue({ eq: mockEqSchool });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqId });

    const mockDeleteEqSchool = vi.fn().mockResolvedValueOnce({ error: null });
    const mockDeleteEqId = vi.fn().mockReturnValue({ eq: mockDeleteEqSchool });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEqId });

    mockFrom.mockReturnValue({
      select: mockSelect,
      delete: mockDelete,
    });
    mockStorageRemove.mockResolvedValueOnce({ error: null });

    const res = await deleteSchoolDocumentAction("doc-123");

    expect(res.success).toBe(true);
    expect(mockStorageRemove).toHaveBeenCalledWith(["school-123/operational-plan/plan.pdf"]);
  });
});
