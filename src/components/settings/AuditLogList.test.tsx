import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuditLogList } from "./AuditLogList";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn().mockImplementation((ns: string) => {
    return (key: string) => `${ns}.${key}`;
  }),
}));

vi.mock("./AuditLogFiltersBar", () => ({
  AuditLogFiltersBar: () => <div data-testid="filters-bar" />,
}));

vi.mock("./AuditLogExportButton", () => ({
  AuditLogExportButton: () => <button data-testid="export-button">Export</button>,
}));

vi.mock("./AuditLogPagination", () => ({
  AuditLogPagination: () => <div data-testid="pagination" />,
}));

describe("AuditLogList", () => {
  it("renders empty state when there are no logs", async () => {
    const Component = await AuditLogList({
      result: { logs: [], totalCount: 0, page: 1, pageSize: 50, totalPages: 0 },
    });
    render(Component);

    expect(screen.getByText("common.noData")).toBeInTheDocument();
    expect(screen.getByTestId("filters-bar")).toBeInTheDocument();
    expect(screen.getByTestId("export-button")).toBeInTheDocument();
  });

  it("renders table with log rows when data is present", async () => {
    const Component = await AuditLogList({
      result: {
        logs: [
          {
            id: "log-1",
            actor_id: "user-1",
            actor_label: "Admin User",
            action: "profiles.update",
            entity_type: "profiles",
            entity_id: "user-1",
            created_at: "2026-10-31T00:00:00.000Z",
          },
        ],
        totalCount: 1,
        page: 1,
        pageSize: 50,
        totalPages: 1,
      },
    });
    render(Component);

    expect(screen.getByText("profiles.update")).toBeInTheDocument();
    expect(screen.getByText("profiles")).toBeInTheDocument();
    expect(screen.getByText("Admin User")).toBeInTheDocument();
  });
});
