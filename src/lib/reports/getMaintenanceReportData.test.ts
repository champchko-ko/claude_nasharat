import { describe, it, expect, vi } from "vitest";
import { getMaintenanceReportData } from "./getMaintenanceReportData";
import { createSupabaseServerClient } from "@/lib/supabase";
import { DatabaseError } from "@/lib/errors/DatabaseError";

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/warnOnDataTruncation", () => ({
  warnOnDataTruncation: vi.fn(),
}));

type MockServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

describe("getMaintenanceReportData", () => {
  it("throws DatabaseError when base query fails", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue(
            Promise.resolve({
              data: null,
              error: { message: "query timeout", code: "PGRST002" },
            }),
          ),
        }),
      }),
    });

    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: mockFrom,
    } as unknown as MockServerClient);

    await expect(getMaintenanceReportData("school-1")).rejects.toThrow(DatabaseError);
  });

  it("calculates summary statistics when query succeeds", async () => {
    const mockData = [
      {
        id: "m-1",
        ticket_number: "T-001",
        title: "Leaking pipe",
        category: "plumbing",
        priority: "high",
        status: "submitted",
        created_at: "2026-01-01T10:00:00Z",
        resolved_at: null,
        reporter_department_id: "d1",
        locations: { building: "A", floor: "1", room: "101" },
        department: { id: "d1", name_ar: "قسم 1", name_en: "Dept 1" },
        reporter: { full_name: "Ahmed Ali" },
        maintenance_assignments: [],
      },
      {
        id: "m-2",
        ticket_number: "T-002",
        title: "Broken window",
        category: "carpentry",
        priority: "low",
        status: "resolved",
        created_at: "2026-01-01T10:00:00Z",
        resolved_at: "2026-01-01T12:00:00Z",
        reporter_department_id: "d1",
        locations: null,
        department: null,
        reporter: null,
        maintenance_assignments: [],
      },
    ];

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue(
            Promise.resolve({
              data: mockData,
              error: null,
            }),
          ),
        }),
      }),
    });

    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: mockFrom,
    } as unknown as MockServerClient);

    const report = await getMaintenanceReportData("school-1");

    expect(report.totalTickets).toBe(2);
    expect(report.openCount).toBe(1);
    expect(report.resolvedCount).toBe(1);
  });
});
