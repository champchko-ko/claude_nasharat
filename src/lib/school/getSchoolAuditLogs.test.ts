import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRange, mockLte, mockGte, mockIlike, mockEq, mockOrder, mockSelect, mockFrom } =
  vi.hoisted(() => ({
    mockRange: vi.fn(),
    mockLte: vi.fn(),
    mockGte: vi.fn(),
    mockIlike: vi.fn(),
    mockEq: vi.fn(),
    mockOrder: vi.fn(),
    mockSelect: vi.fn(),
    mockFrom: vi.fn(),
  }));

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    from: mockFrom,
  }),
}));

import { getSchoolAuditLogs } from "./getSchoolAuditLogs";

describe("getSchoolAuditLogs", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const chain: Record<string, unknown> = {};
    chain.select = mockSelect.mockReturnValue(chain);
    chain.order = mockOrder.mockReturnValue(chain);
    chain.eq = mockEq.mockReturnValue(chain);
    chain.ilike = mockIlike.mockReturnValue(chain);
    chain.gte = mockGte.mockReturnValue(chain);
    chain.lte = mockLte.mockReturnValue(chain);
    chain.range = mockRange.mockResolvedValue({
      data: [{ id: "log-1", action: "profiles.update" }],
      count: 1,
      error: null,
    });

    mockFrom.mockReturnValue(chain);
  });

  it("queries audit logs with default pagination", async () => {
    const result = await getSchoolAuditLogs("school-1");

    expect(mockFrom).toHaveBeenCalledWith("audit_logs");
    expect(mockEq).toHaveBeenCalledWith("school_id", "school-1");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(mockRange).toHaveBeenCalledWith(0, 49);
    expect(result.logs).toHaveLength(1);
    expect(result.totalCount).toBe(1);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it("applies filters when provided", async () => {
    await getSchoolAuditLogs("school-1", {
      action: "update",
      entityType: "profiles",
      actorLabel: "Alice",
      startDate: "2026-10-01",
      endDate: "2026-10-31",
      page: 2,
      pageSize: 10,
    });

    expect(mockIlike).toHaveBeenCalledWith("action", "%update%");
    expect(mockEq).toHaveBeenCalledWith("entity_type", "profiles");
    expect(mockIlike).toHaveBeenCalledWith("actor_label", "%Alice%");
    expect(mockGte).toHaveBeenCalledWith("created_at", "2026-10-01");
    expect(mockLte).toHaveBeenCalledWith("created_at", "2026-10-31");
    expect(mockRange).toHaveBeenCalledWith(10, 19);
  });
});
