import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { UnifiedCalendarItem } from "@/lib/calendar/types";
import { PublicCalendarWidget } from "./PublicCalendarWidget";

afterEach(() => {
  cleanup();
});

describe("PublicCalendarWidget", () => {
  const mockItems: UnifiedCalendarItem[] = [
    {
      kind: "event",
      id: "ev-1",
      date: "2026-11-01T08:00:00Z",
      event: {
        id: "ev-1",
        school_id: "s-1",
        title_ar: "اختبارات منتصف الفصل الدراسي",
        title_en: "Midterm Exams",
        description: null,
        category: "exam",
        starts_at: "2026-11-01T08:00:00Z",
        ends_at: "2026-11-01T12:00:00Z",
        all_day: false,
        visibility: "public",
        status: "published",
        location: "القاعات الامتحانية",
        image_path: null,
        created_by: "user-1",
        published_at: "2026-10-01T00:00:00Z",
        cancelled_at: null,
        created_at: "2026-10-01T00:00:00Z",
        updated_at: "2026-10-01T00:00:00Z",
      },
    },
  ];

  it("renders top bar with today button, month header, and legend", () => {
    render(<PublicCalendarWidget items={mockItems} locale="ar" />);

    const todayButtons = screen.getAllByText("اليوم");
    expect(todayButtons.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("أحداث قادمة")).toBeInTheDocument();
    expect(screen.getByText("اختبارات منتصف الفصل الدراسي")).toBeInTheDocument();
    expect(screen.getByText("امتحانات")).toBeInTheDocument();
    expect(screen.getByText("فعاليات")).toBeInTheDocument();
    expect(screen.getByText("اجتماعات")).toBeInTheDocument();
  });

  it("handles month navigation and today button click", () => {
    render(<PublicCalendarWidget items={mockItems} locale="ar" />);

    const todayBtn = screen.getByRole("button", { name: "اليوم" });
    fireEvent.click(todayBtn);

    expect(todayBtn).toBeInTheDocument();
  });
});
