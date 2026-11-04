import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAssertAuth, mockUploadFile, mockInsertRecord } = vi.hoisted(() => ({
  mockAssertAuth: vi.fn(),
  mockUploadFile: vi.fn(),
  mockInsertRecord: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/documents/assertCanManageDocuments", () => ({
  assertCanManageDocuments: () => mockAssertAuth(),
}));

vi.mock("@/lib/documents/uploadDocumentFile", () => ({
  uploadDocumentFile: (...args: unknown[]) => mockUploadFile(...args),
}));

vi.mock("@/lib/documents/insertSchoolDocumentRecord", () => ({
  insertSchoolDocumentRecord: (...args: unknown[]) => mockInsertRecord(...args),
}));

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({}),
  createSupabaseAdminClient: vi.fn().mockReturnValue({}),
}));

import { createSchoolDocumentAction } from "./createSchoolDocumentAction";

describe("createSchoolDocumentAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails if user is unauthorized", async () => {
    mockAssertAuth.mockResolvedValueOnce({ allowed: false });

    const formData = new FormData();
    formData.append("slug", "operational-plan");
    formData.append("title", "Test Plan");

    const res = await createSchoolDocumentAction(formData);

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe("Unauthorized to manage school documents");
    }
  });

  it("fails if slug is invalid", async () => {
    mockAssertAuth.mockResolvedValueOnce({
      allowed: true,
      schoolId: "school-123",
      profile: { id: "user-123" },
    });

    const formData = new FormData();
    formData.append("slug", "invalid-slug");
    formData.append("title", "Test Title");

    const res = await createSchoolDocumentAction(formData);

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe("Invalid document category");
    }
  });

  it("fails if file is missing", async () => {
    mockAssertAuth.mockResolvedValueOnce({
      allowed: true,
      schoolId: "school-123",
      profile: { id: "user-123" },
    });

    const formData = new FormData();
    formData.append("slug", "operational-plan");
    formData.append("title", "Test Plan");

    const res = await createSchoolDocumentAction(formData);

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe("Document file is required");
    }
  });

  it("uploads file and inserts document record successfully", async () => {
    mockAssertAuth.mockResolvedValueOnce({
      allowed: true,
      schoolId: "school-123",
      profile: { id: "user-123" },
    });

    mockUploadFile.mockResolvedValueOnce({
      path: "school-123/operational-plan/test.pdf",
      error: null,
    });
    mockInsertRecord.mockResolvedValueOnce("doc-abc-123");

    const dummyFile = new File(["dummy content"], "plan.pdf", { type: "application/pdf" });
    const formData = new FormData();
    formData.append("slug", "operational-plan");
    formData.append("title", "Operational Plan 2026");
    formData.append("description", "Official operational plan");
    formData.append("file", dummyFile);

    const res = await createSchoolDocumentAction(formData);

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.documentId).toBe("doc-abc-123");
    }
    expect(mockUploadFile).toHaveBeenCalled();
    expect(mockInsertRecord).toHaveBeenCalled();
  });
});
