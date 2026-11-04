import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAssertAuth, mockReplaceFile, mockFrom } = vi.hoisted(() => ({
  mockAssertAuth: vi.fn(),
  mockReplaceFile: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/documents/assertCanManageDocuments", () => ({
  assertCanManageDocuments: () => mockAssertAuth(),
}));

vi.mock("@/lib/documents/replaceDocumentFile", () => ({
  replaceDocumentFile: (...args: unknown[]) => mockReplaceFile(...args),
}));

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    from: (...args: unknown[]) => mockFrom(...args),
  }),
  createSupabaseAdminClient: vi.fn().mockReturnValue({
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}));

import { updateSchoolDocumentAction } from "./updateSchoolDocumentAction";

describe("updateSchoolDocumentAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails if unauthorized", async () => {
    mockAssertAuth.mockResolvedValueOnce({ allowed: false });

    const formData = new FormData();
    formData.append("id", "doc-123");
    formData.append("title", "New Title");

    const res = await updateSchoolDocumentAction(formData);

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe("Unauthorized to manage school documents");
    }
  });

  it("updates metadata without replacing file when no file is uploaded", async () => {
    mockAssertAuth.mockResolvedValueOnce({
      allowed: true,
      schoolId: "school-123",
    });

    const mockSingle = vi.fn().mockResolvedValueOnce({
      data: {
        id: "doc-123",
        school_id: "school-123",
        slug: "operational-plan",
        file_path: "school-123/operational-plan/old.pdf",
      },
      error: null,
    });
    const mockEqSchool = vi.fn().mockReturnValue({ single: mockSingle });
    const mockEqId = vi.fn().mockReturnValue({ eq: mockEqSchool });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqId });

    const mockUpdateEqSchool = vi.fn().mockResolvedValueOnce({ error: null });
    const mockUpdateEqId = vi.fn().mockReturnValue({ eq: mockUpdateEqSchool });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEqId });

    mockFrom.mockImplementation((table: string) => {
      if (table === "school_documents") {
        return {
          select: mockSelect,
          update: mockUpdate,
        };
      }
      return {};
    });

    const formData = new FormData();
    formData.append("id", "doc-123");
    formData.append("title", "Updated Title");
    formData.append("description", "Updated Description");

    const res = await updateSchoolDocumentAction(formData);

    expect(res.success).toBe(true);
    expect(mockReplaceFile).not.toHaveBeenCalled();
  });

  it("replaces file in storage when a new file is uploaded", async () => {
    mockAssertAuth.mockResolvedValueOnce({
      allowed: true,
      schoolId: "school-123",
    });

    const mockSingle = vi.fn().mockResolvedValueOnce({
      data: {
        id: "doc-123",
        school_id: "school-123",
        slug: "operational-plan",
        file_path: "school-123/operational-plan/old.pdf",
      },
      error: null,
    });
    const mockEqSchool = vi.fn().mockReturnValue({ single: mockSingle });
    const mockEqId = vi.fn().mockReturnValue({ eq: mockEqSchool });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqId });

    const mockUpdateEqSchool = vi.fn().mockResolvedValueOnce({ error: null });
    const mockUpdateEqId = vi.fn().mockReturnValue({ eq: mockUpdateEqSchool });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEqId });

    mockFrom.mockImplementation((table: string) => {
      if (table === "school_documents") {
        return {
          select: mockSelect,
          update: mockUpdate,
        };
      }
      return {};
    });

    mockReplaceFile.mockResolvedValueOnce({
      file_path: "school-123/operational-plan/new.pdf",
      file_name: "new.pdf",
      file_size: 1024,
      mime_type: "application/pdf",
    });

    const newFile = new File(["new-content"], "new.pdf", { type: "application/pdf" });
    const formData = new FormData();
    formData.append("id", "doc-123");
    formData.append("title", "Updated Title");
    formData.append("file", newFile);

    const res = await updateSchoolDocumentAction(formData);

    expect(res.success).toBe(true);
    expect(mockReplaceFile).toHaveBeenCalled();
  });
});
