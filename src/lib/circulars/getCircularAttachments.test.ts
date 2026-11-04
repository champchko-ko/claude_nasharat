import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCircularAttachments } from "./getCircularAttachments";

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockCreateSignedUrls = vi.fn();

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          order: mockOrder,
        }),
      }),
    })),
  })),
  createSupabaseAdminClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        createSignedUrls: mockCreateSignedUrls,
      })),
    },
  })),
}));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

describe("getCircularAttachments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty array when there are no attachments", async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });

    const result = await getCircularAttachments("circ-123");
    expect(result).toEqual([]);
    expect(mockCreateSignedUrls).not.toHaveBeenCalled();
  });

  it("batches signed URLs in a single call with 3600s expiry", async () => {
    const rawAttachments = [
      {
        id: "att-1",
        circular_id: "circ-123",
        school_id: "sch-1",
        path: "circ-123/doc1.pdf",
        mime: "application/pdf",
        size_bytes: 1024,
        uploaded_by: "user-1",
        created_at: "2026-11-01T00:00:00Z",
      },
      {
        id: "att-2",
        circular_id: "circ-123",
        school_id: "sch-1",
        path: "circ-123/doc2.pdf",
        mime: "application/pdf",
        size_bytes: 2048,
        uploaded_by: "user-1",
        created_at: "2026-11-01T00:01:00Z",
      },
    ];

    mockOrder.mockResolvedValueOnce({ data: rawAttachments, error: null });
    mockCreateSignedUrls.mockResolvedValueOnce({
      data: [
        { path: "circ-123/doc1.pdf", signedUrl: "https://storage.example/signed1", error: null },
        { path: "circ-123/doc2.pdf", signedUrl: "https://storage.example/signed2", error: null },
      ],
      error: null,
    });

    const result = await getCircularAttachments("circ-123");

    expect(mockCreateSignedUrls).toHaveBeenCalledTimes(1);
    expect(mockCreateSignedUrls).toHaveBeenCalledWith(
      ["circ-123/doc1.pdf", "circ-123/doc2.pdf"],
      3600,
    );
    expect(result).toHaveLength(2);
    expect(result[0]?.public_url).toBe("https://storage.example/signed1");
    expect(result[1]?.public_url).toBe("https://storage.example/signed2");
  });

  it("throws on database query errors", async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: "DB query failed" } });

    await expect(getCircularAttachments("circ-123")).rejects.toThrow();
  });
});
