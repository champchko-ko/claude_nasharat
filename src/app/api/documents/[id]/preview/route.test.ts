import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAssertCanManageDocuments, mockAdmin } = vi.hoisted(() => ({
  mockAssertCanManageDocuments: vi.fn(),
  mockAdmin: { from: vi.fn(), storage: { from: vi.fn() } },
}));

vi.mock("@/lib/documents/assertCanManageDocuments", () => ({
  assertCanManageDocuments: mockAssertCanManageDocuments,
}));

vi.mock("@/lib/documents/getActorDetails", () => ({
  getActorDetails: vi.fn(() => ({ actorId: "user-1" })),
}));

vi.mock("@/lib/school/getFirstActiveSchoolId", () => ({
  getFirstActiveSchoolId: vi.fn().mockResolvedValue("school-1"),
}));

vi.mock("@/lib/documents/isPublicDocumentPreviewAllowed", () => ({
  isPublicDocumentPreviewAllowed: vi.fn().mockResolvedValue(false),
}));

vi.mock("@/lib/supabase", () => ({
  createSupabaseAdminClient: vi.fn(() => mockAdmin),
}));

import { GET } from "./route";

describe("GET /api/documents/[id]/preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not expose an unpublished document to public callers", async () => {
    mockAssertCanManageDocuments.mockResolvedValue({ allowed: false });
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        file_path: "school-1/operational-plan/plan.pdf",
        mime_type: "application/pdf",
        is_published: false,
      },
      error: null,
    });
    mockAdmin.from.mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }),
    });

    const response = await GET(new Request("http://localhost/api/documents/document-1/preview"), {
      params: Promise.resolve({ id: "document-1" }),
    });

    expect(response.status).toBe(404);
  });

  it("redirects authorized viewers to a short-lived storage URL", async () => {
    mockAssertCanManageDocuments.mockResolvedValue({
      allowed: true,
      schoolId: "school-1",
      profile: { id: "user-1", email: "owner@example.test" },
    });
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        file_path: "school-1/operational-plan/plan.pdf",
        mime_type: "application/pdf",
        is_published: true,
      },
      error: null,
    });
    const createSignedUrl = vi.fn().mockResolvedValue({
      data: {
        signedUrl: "https://storage.example/signed-document-url",
      },
      error: null,
    });
    mockAdmin.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ maybeSingle }),
      }),
    });
    mockAdmin.storage.from.mockReturnValue({ createSignedUrl });

    const response = await GET(new Request("http://localhost/api/documents/document-1/preview"), {
      params: Promise.resolve({ id: "document-1" }),
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://storage.example/signed-document-url");
    expect(createSignedUrl).toHaveBeenCalledWith("school-1/operational-plan/plan.pdf", 120);
  });
});
