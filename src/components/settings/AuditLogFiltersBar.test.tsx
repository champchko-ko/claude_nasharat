import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}));

vi.mock("@/i18n", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/settings/audit",
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    if (key === "auditFilterAction") return "Filter by action (e.g. update, insert)";
    if (key === "auditFilterEntity") return "Entity type (e.g. profiles, roles)";
    if (key === "auditFilterActor") return "Actor name or email";
    return key;
  },
}));

import { AuditLogFiltersBar } from "./AuditLogFiltersBar";

describe("AuditLogFiltersBar", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders filter inputs and handles form submission", () => {
    const { getByPlaceholderText, getByRole } = render(
      <AuditLogFiltersBar initialFilters={{ action: "profiles.insert" }} />,
    );

    const actionInput = getByPlaceholderText(/filter by action/i);
    expect(actionInput).toHaveValue("profiles.insert");

    const submitButton = getByRole("button", { name: /search/i });
    fireEvent.click(submitButton);

    expect(mockPush).toHaveBeenCalledWith("/settings/audit?action=profiles.insert&page=1");
  });

  it("resets filter form on reset click", () => {
    const { getByRole } = render(
      <AuditLogFiltersBar initialFilters={{ action: "roles.delete" }} />,
    );

    const resetButton = getByRole("button", { name: /reset/i });
    fireEvent.click(resetButton);

    expect(mockPush).toHaveBeenCalledWith("/settings/audit");
  });
});
