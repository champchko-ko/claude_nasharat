import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const { mockAssertCanManage, mockCreateCircularRecord, mockInsertTargets, mockHandleUploads } =
  vi.hoisted(() => ({
    mockAssertCanManage: vi.fn(),
    mockCreateCircularRecord: vi.fn(),
    mockInsertTargets: vi.fn(),
    mockHandleUploads: vi.fn(),
  }));

vi.mock("@/lib/circulars/assertCanManageCirculars", () => ({
  assertCanManageCirculars: () => mockAssertCanManage(),
}));
vi.mock("@/lib/circulars/createCircularRecord", () => ({
  createCircularRecord: (...args: unknown[]) => mockCreateCircularRecord(...args),
}));
vi.mock("@/lib/circulars/insertCircularTargets", () => ({
  insertCircularTargets: (...args: unknown[]) => mockInsertTargets(...args),
}));
vi.mock("@/lib/circulars/handleCircularDocumentsUpload", () => ({
  handleCircularDocumentsUpload: () => mockHandleUploads(),
}));
vi.mock("@/lib/circulars/assertValidCircularDocuments", () => ({
  assertValidCircularDocuments: () => Promise.resolve(),
}));
vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: () => Promise.resolve({}),
  createSupabaseAdminClient: () => ({}),
}));

import { createCircularAction } from "./createCircularAction";

describe("createCircularAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates circular successfully when caller has permission", async () => {
    mockAssertCanManage.mockResolvedValue({
      authorized: true,
      profileId: "user-1",
      schoolId: "school-1",
      isOwner: false,
    });
    mockCreateCircularRecord.mockResolvedValue({ circularId: "circ-123" });
    mockInsertTargets.mockResolvedValue({});
    mockHandleUploads.mockResolvedValue({});

    const formData = new FormData();
    formData.append("title", "Exam Schedule");
    formData.append("body", "Details regarding the exam schedule");
    formData.append("priority", "normal");
    formData.append("visibility", "internal");
    formData.append("response_type", "acknowledgement");

    const res = await createCircularAction(formData);

    expect(res).toEqual({ success: true, circularId: "circ-123" });
  });

  it("handles platform owner creation using admin client", async () => {
    mockAssertCanManage.mockResolvedValue({
      authorized: true,
      profileId: "owner-1",
      schoolId: "school-1",
      isOwner: true,
    });
    mockCreateCircularRecord.mockResolvedValue({ circularId: "circ-owner-1" });
    mockInsertTargets.mockResolvedValue({});
    mockHandleUploads.mockResolvedValue({});

    const formData = new FormData();
    formData.append("title", "Owner Circular");
    formData.append("body", "Circular created by platform owner");
    formData.append("priority", "high");
    formData.append("visibility", "public");
    formData.append("response_type", "acknowledgement");

    const res = await createCircularAction(formData);

    expect(res).toEqual({ success: true, circularId: "circ-owner-1" });
  });

  it("rejects unauthorized caller", async () => {
    mockAssertCanManage.mockResolvedValue({
      authorized: false,
      error: "Unauthorized",
    });

    const formData = new FormData();
    formData.append("title", "Test");
    formData.append("body", "Test body");

    const res = await createCircularAction(formData);

    expect(res.success).toBe(false);
    expect(res.error).toContain("Unauthorized");
  });
});
