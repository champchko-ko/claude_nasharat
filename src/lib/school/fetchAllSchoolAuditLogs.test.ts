import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAllSchoolAuditLogs } from "./fetchAllSchoolAuditLogs";

const mockRange = vi.fn();
const mockOrder = vi.fn(() => ({ range: mockRange }));
const mockSelect = vi.fn(() => ({ order: mockOrder }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: mockFrom,
  })),
}));

vi.mock("./applyAuditQueryFilters", () => ({
  applyAuditQueryFilters: vi.fn((query) => query),
}));

describe("fetchAllSchoolAuditLogs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches a single batch when total rows are fewer than batch size", async () => {
    const fakeRows = [
      { id: "log-1", action: "user.login", created_at: "2026-11-01" },
      { id: "log-2", action: "user.logout", created_at: "2026-11-01" },
    ];

    mockRange.mockResolvedValueOnce({ data: fakeRows, error: null });

    const result = await fetchAllSchoolAuditLogs("school-1", {}, 100);

    expect(result).toHaveLength(2);
    expect(mockRange).toHaveBeenCalledTimes(1);
    expect(mockRange).toHaveBeenCalledWith(0, 99);
  });

  it("paginates through multiple batches until all records are retrieved", async () => {
    const batch1 = Array.from({ length: 100 }, (_, i) => ({
      id: `log-${i}`,
      action: "batch1",
      created_at: "2026-11-01",
    }));
    const batch2 = Array.from({ length: 25 }, (_, i) => ({
      id: `log-${100 + i}`,
      action: "batch2",
      created_at: "2026-11-01",
    }));

    mockRange
      .mockResolvedValueOnce({ data: batch1, error: null })
      .mockResolvedValueOnce({ data: batch2, error: null });

    const result = await fetchAllSchoolAuditLogs("school-1", {}, 100);

    expect(result).toHaveLength(125);
    expect(mockRange).toHaveBeenCalledTimes(2);
    expect(mockRange).toHaveBeenNthCalledWith(1, 0, 99);
    expect(mockRange).toHaveBeenNthCalledWith(2, 100, 199);
  });

  it("throws mapped database error on query failure", async () => {
    mockRange.mockResolvedValueOnce({ data: null, error: { message: "Database read timeout" } });

    await expect(fetchAllSchoolAuditLogs("school-1", {}, 100)).rejects.toThrow();
  });
});
