import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMaintenanceAttachments } from "./getMaintenanceAttachments";

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

describe("getMaintenanceAttachments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty array when there are no attachments", async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });

    const result = await getMaintenanceAttachments("req-123");
    expect(result).toEqual([]);
    expect(mockCreateSignedUrls).not.toHaveBeenCalled();
  });

  it("batches signed URLs in a single call with 3600s expiry", async () => {
    const rawPhotos = [
      {
        id: "att-1",
        request_id: "req-123",
        kind: "photo",
        path: "req-123/before.jpg",
        mime: "image/jpeg",
        size_bytes: 512,
        uploaded_by: "user-1",
        created_at: "2026-11-01T00:00:00Z",
      },
    ];

    mockOrder.mockResolvedValueOnce({ data: rawPhotos, error: null });
    mockCreateSignedUrls.mockResolvedValueOnce({
      data: [
        { path: "req-123/before.jpg", signedUrl: "https://storage.example/photo1", error: null },
      ],
      error: null,
    });

    const result = await getMaintenanceAttachments("req-123");

    expect(mockCreateSignedUrls).toHaveBeenCalledTimes(1);
    expect(mockCreateSignedUrls).toHaveBeenCalledWith(["req-123/before.jpg"], 3600);
    expect(result).toHaveLength(1);
    expect(result[0]?.public_url).toBe("https://storage.example/photo1");
  });

  it("throws on database query errors", async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: "DB query failed" } });

    await expect(getMaintenanceAttachments("req-123")).rejects.toThrow();
  });
});
