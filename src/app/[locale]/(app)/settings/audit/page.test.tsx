import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const { mockAssertCanViewAudit, mockGetSchoolAuditLogs, mockRedirect } = vi.hoisted(() => ({
  mockAssertCanViewAudit: vi.fn(),
  mockGetSchoolAuditLogs: vi.fn(),
  mockRedirect: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn().mockImplementation((ns: string) => {
    return (key: string) => `${ns}.${key}`;
  }),
  setRequestLocale: vi.fn(),
}));

vi.mock("@/i18n", () => ({
  redirect: mockRedirect,
}));

vi.mock("@/lib/audit/assertCanViewAudit", () => ({
  assertCanViewAudit: mockAssertCanViewAudit,
}));

vi.mock("@/lib/school/getSchoolAuditLogs", () => ({
  getSchoolAuditLogs: mockGetSchoolAuditLogs,
}));

vi.mock("@/components/settings/AuditLogList", () => ({
  AuditLogList: () => <div data-testid="audit-log-list" />,
}));

import AuditSettingsPage from "./page";

describe("AuditSettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthorized callers to /settings", async () => {
    mockAssertCanViewAudit.mockResolvedValue({
      authorized: false,
      error: "Forbidden",
    });

    await AuditSettingsPage({
      params: Promise.resolve({ locale: "en" }),
    });

    expect(mockRedirect).toHaveBeenCalledWith({ href: "/settings", locale: "en" });
  });

  it("renders audit page when user is authorized", async () => {
    mockAssertCanViewAudit.mockResolvedValue({
      authorized: true,
      profile: { id: "user-1" },
      schoolId: "sch-1",
      isOwner: false,
    });

    mockGetSchoolAuditLogs.mockResolvedValue({
      logs: [],
      totalCount: 0,
      page: 1,
      pageSize: 50,
      totalPages: 0,
    });

    const Component = await AuditSettingsPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({ action: "profiles" }),
    });

    render(Component);

    expect(screen.getByText("settings.audit")).toBeInTheDocument();
    expect(screen.getByTestId("audit-log-list")).toBeInTheDocument();
    expect(mockGetSchoolAuditLogs).toHaveBeenCalledWith("sch-1", {
      action: "profiles",
      entityType: undefined,
      actorLabel: undefined,
      startDate: undefined,
      endDate: undefined,
      page: 1,
      pageSize: 50,
    });
  });
});
