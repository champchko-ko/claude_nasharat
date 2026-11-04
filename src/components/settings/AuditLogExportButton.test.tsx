import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AuditLogExportButton } from "./AuditLogExportButton";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("AuditLogExportButton", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders export button and triggers download click", () => {
    const appendSpy = vi.spyOn(document.body, "appendChild");
    const removeSpy = vi.spyOn(document.body, "removeChild");

    render(<AuditLogExportButton filters={{ action: "profiles.update" }} />);

    const button = screen.getByRole("button", { name: /Export CSV/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();

    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
