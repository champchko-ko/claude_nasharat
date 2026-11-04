import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAssertCanViewAudit, mockFetchAllSchoolAuditLogs, mockBuildAuditCsv } = vi.hoisted(
  () => ({
    mockAssertCanViewAudit: vi.fn(),
    mockFetchAllSchoolAuditLogs: vi.fn(),
    mockBuildAuditCsv: vi.fn(),
  }),
);

vi.mock("@/lib/audit/assertCanViewAudit", () => ({
  assertCanViewAudit: mockAssertCanViewAudit,
}));

vi.mock("@/lib/school/fetchAllSchoolAuditLogs", () => ({
  fetchAllSchoolAuditLogs: mockFetchAllSchoolAuditLogs,
}));

vi.mock("@/lib/audit/buildAuditCsv", () => ({
  buildAuditCsv: mockBuildAuditCsv,
}));

import { GET } from "./route";

describe("GET /api/audit/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when user is not authorized", async () => {
    mockAssertCanViewAudit.mockResolvedValue({
      authorized: false,
      error: "Forbidden",
    });

    const request = new Request("http://localhost:3000/api/audit/export");
    const response = await GET(request);

    expect(response.status).toBe(403);
  });

  it("returns CSV response when user is authorized", async () => {
    mockAssertCanViewAudit.mockResolvedValue({
      authorized: true,
      profile: { id: "user-1", school_id: "sch-1" },
      schoolId: "sch-1",
      isOwner: false,
    });

    mockFetchAllSchoolAuditLogs.mockResolvedValue([{ id: "log-1", action: "profiles.update" }]);

    mockBuildAuditCsv.mockReturnValue("\uFEFFTimestamp,Action\r\n2026-10-31,profiles.update");

    const request = new Request("http://localhost:3000/api/audit/export?action=profiles");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(response.headers.get("Content-Disposition")).toContain("attachment;");
    expect(response.headers.get("Cache-Control")).toBe(
      "no-store, no-cache, must-revalidate, private",
    );
    const text = await response.text();
    expect(text).toContain("profiles.update");
  });
});
