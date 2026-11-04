import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAssertCanManageCalendar, mockGetSchoolFullDetails, mockCreateCalendarEventSeries } =
  vi.hoisted(() => ({
    mockAssertCanManageCalendar: vi.fn(),
    mockGetSchoolFullDetails: vi.fn(),
    mockCreateCalendarEventSeries: vi.fn(),
  }));

vi.mock("@/lib/calendar/assertCanManageCalendar", () => ({
  assertCanManageCalendar: mockAssertCanManageCalendar,
}));

vi.mock("@/lib/school/getSchoolFullDetails", () => ({
  getSchoolFullDetails: mockGetSchoolFullDetails,
}));

vi.mock("@/lib/calendar/createCalendarEventSeries", () => ({
  createCalendarEventSeries: mockCreateCalendarEventSeries,
}));

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({}),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { createCalendarEventAction } from "./createCalendarEventAction";

describe("createCalendarEventAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates calendar event using school working days", async () => {
    mockAssertCanManageCalendar.mockResolvedValue({
      schoolId: "sch-1",
      profileId: "usr-1",
    });

    mockGetSchoolFullDetails.mockResolvedValue({
      working_days: [0, 1, 2, 3, 4],
    });

    mockCreateCalendarEventSeries.mockResolvedValue({
      firstEventId: "evt-1",
      error: null,
    });

    const formData = new FormData();
    formData.append("title_ar", "حفل التكريم");
    formData.append("starts_at", "2026-11-22T09:00:00");
    formData.append("ends_at", "2026-11-22T11:00:00");

    const result = await createCalendarEventAction(formData);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.eventId).toBe("evt-1");
  });

  it("fails if scheduled on a non-working day", async () => {
    mockAssertCanManageCalendar.mockResolvedValue({
      schoolId: "sch-1",
      profileId: "usr-1",
    });

    mockGetSchoolFullDetails.mockResolvedValue({
      working_days: [0, 1, 2, 3, 4],
    });

    const formData = new FormData();
    formData.append("title_ar", "فعالية الجمعة");
    formData.append("starts_at", "2026-11-20T09:00:00");
    formData.append("ends_at", "2026-11-20T11:00:00");

    const result = await createCalendarEventAction(formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Events cannot be scheduled on weekends");
  });
});
