import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { UnifiedCalendarItem } from "@/lib/calendar/types";
import { PublicCalendarItemCard } from "./PublicCalendarItemCard";

describe("PublicCalendarItemCard", () => {
  it("renders event title and category properly in Arabic", () => {
    const item: UnifiedCalendarItem = {
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
    };

    render(<PublicCalendarItemCard item={item} locale="ar" />);

    expect(screen.getByText("اختبارات منتصف الفصل الدراسي")).toBeInTheDocument();
    expect(screen.getByText("القاعات الامتحانية")).toBeInTheDocument();
    expect(screen.getByText("امتحانات عامة")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("NOV")).toBeInTheDocument();
  });

  it("renders circular as public bulletin card", () => {
    const item: UnifiedCalendarItem = {
      kind: "circular",
      id: "circ-1",
      date: "2026-11-15T00:00:00Z",
      circular: {
        id: "circ-1",
        school_id: "s-1",
        ref_number: "CIRC-2026-001",
        title: "نشرة توعوية حول الاختبارات",
        body: "تفاصيل النشرة التوعوية",
        category: "bulletin",
        priority: "normal",
        status: "published",
        visibility: "public",
        response_type: "acknowledgement",
        response_instructions: null,
        allow_response_revision: false,
        publish_at: "2026-11-15T00:00:00Z",
        due_at: null,
        created_by: "admin-1",
        closed_at: null,
        created_at: "2026-11-15T00:00:00Z",
      },
    };

    render(<PublicCalendarItemCard item={item} locale="ar" />);

    expect(screen.getByText("نشرة توعوية حول الاختبارات")).toBeInTheDocument();
    expect(screen.getByText("CIRC-2026-001")).toBeInTheDocument();
    expect(screen.getByText("نشرة عامة")).toBeInTheDocument();
  });
});
