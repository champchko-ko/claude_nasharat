import { describe, expect, it } from "vitest";
import { buildUnifiedCalendarItems } from "./buildUnifiedCalendarItems";
import type { CalendarEventRow } from "./types";
import type { CircularRow } from "@/lib/circulars/types";

describe("buildUnifiedCalendarItems", () => {
  const mockEvent: CalendarEventRow = {
    id: "event-1",
    school_id: "sch-1",
    title_ar: "حفل مدرسي",
    title_en: "School Gala",
    description: "Annual gala",
    category: "event",
    visibility: "public",
    starts_at: "2026-11-10T10:00:00Z",
    ends_at: "2026-11-10T12:00:00Z",
    all_day: false,
    location: "Main Auditorium",
    image_path: null,
    status: "published",
    created_by: "user-1",
    published_at: "2026-10-01T00:00:00Z",
    cancelled_at: null,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
  };

  const mockCircular: CircularRow = {
    id: "circ-1",
    school_id: "sch-1",
    ref_number: "CIRC-2026-001",
    title: "Exam Instructions",
    body: "Please submit syllabus",
    category: "administrative",
    priority: "high",
    status: "published",
    visibility: "internal",
    response_type: "acknowledgement",
    response_instructions: null,
    allow_response_revision: false,
    publish_at: "2026-11-05T08:00:00Z",
    due_at: "2026-11-08T15:00:00Z",
    created_by: "user-1",
    closed_at: null,
    created_at: "2026-10-01T00:00:00Z",
  };

  it("merges calendar events and published circulars chronologically", () => {
    const items = buildUnifiedCalendarItems([mockEvent], [mockCircular]);

    expect(items).toHaveLength(2);
    // Circular due date 2026-11-08 comes before event 2026-11-10
    expect(items[0]).toEqual({
      kind: "circular",
      id: "circ-1",
      date: "2026-11-08T15:00:00Z",
      circular: mockCircular,
    });
    expect(items[1]).toEqual({
      kind: "event",
      id: "event-1",
      date: "2026-11-10T10:00:00Z",
      event: mockEvent,
    });
  });

  it("ignores draft and cancelled circulars", () => {
    const draftCircular = { ...mockCircular, id: "circ-draft", status: "draft" as const };
    const cancelledCircular = {
      ...mockCircular,
      id: "circ-cancelled",
      status: "cancelled" as const,
    };

    const items = buildUnifiedCalendarItems([], [draftCircular, cancelledCircular]);
    expect(items).toHaveLength(0);
  });

  it("falls back to publish_at or created_at if circular due_at is null", () => {
    const circularNoDue = {
      ...mockCircular,
      id: "circ-no-due",
      due_at: null,
      publish_at: "2026-11-02T08:00:00Z",
    };

    const items = buildUnifiedCalendarItems([], [circularNoDue]);
    expect(items).toHaveLength(1);
    expect(items[0].date).toBe("2026-11-02T08:00:00Z");
  });
});
