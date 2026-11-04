import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}));

vi.mock("@/i18n", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/settings/audit",
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (key === "auditTotalEntries") return `${params?.count} total entries`;
    if (key === "auditPageOf")
      return `Page ${params?.page} of ${params?.totalPages} (${params?.totalCount} entries)`;
    if (key === "auditPrevious") return "Previous";
    if (key === "auditNext") return "Next";
    return key;
  },
}));

import { AuditLogPagination } from "./AuditLogPagination";

describe("AuditLogPagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders single page total count without pagination buttons", () => {
    render(<AuditLogPagination page={1} totalPages={1} totalCount={25} />);

    expect(screen.getByText("25 total entries")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /previous/i })).not.toBeInTheDocument();
  });

  it("renders pagination buttons and handles page navigation", () => {
    render(
      <AuditLogPagination
        page={2}
        totalPages={5}
        totalCount={250}
        filters={{ action: "update" }}
      />,
    );

    expect(screen.getByText("Page 2 of 5 (250 entries)")).toBeInTheDocument();

    const prevButton = screen.getByRole("button", { name: /previous/i });
    const nextButton = screen.getByRole("button", { name: /next/i });

    expect(prevButton).toBeEnabled();
    expect(nextButton).toBeEnabled();

    fireEvent.click(nextButton);
    expect(mockPush).toHaveBeenCalledWith("/settings/audit?action=update&page=3");

    fireEvent.click(prevButton);
    expect(mockPush).toHaveBeenCalledWith("/settings/audit?action=update&page=1");
  });
});
