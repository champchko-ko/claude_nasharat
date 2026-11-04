import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { CircularResponseFilterBar } from "./CircularResponseFilterBar";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: { responded?: number; total?: number }) => {
    const translations: Record<string, string> = {
      allFilter: "الكل",
      respondedFilter: "تم الرد",
      acknowledgedFilter: "تم الاطلاع",
      rejectedFilter: "الرفض",
      notRespondedFilter: "لم يتم الرد",
      respondedProgress: `استجاب ${values?.responded ?? 0} من أصل ${values?.total ?? 0} أقسام`,
    };
    return translations[key] ?? key;
  },
}));

describe("CircularResponseFilterBar", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders filter buttons for All, Responded (تم الرد), Acknowledged (تم الاطلاع), and Not Responded (لم يتم الرد)", () => {
    const setFilter = vi.fn();

    render(
      <CircularResponseFilterBar
        filter="all"
        setFilter={setFilter}
        totalCount={10}
        respondedCount={5}
        acknowledgedCount={3}
        rejectedCount={1}
        pendingCount={1}
      />,
    );

    expect(screen.getByRole("button", { name: /الكل \(10\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /تم الرد \(5\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /تم الاطلاع \(3\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /الرفض \(1\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /لم يتم الرد \(1\)/i })).toBeInTheDocument();
  });

  it("triggers filter change when clicked", () => {
    const setFilter = vi.fn();

    render(
      <CircularResponseFilterBar
        filter="all"
        setFilter={setFilter}
        totalCount={10}
        respondedCount={5}
        acknowledgedCount={3}
        rejectedCount={0}
        pendingCount={2}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /تم الاطلاع/i }));
    expect(setFilter).toHaveBeenCalledWith("acknowledged");
  });
});
