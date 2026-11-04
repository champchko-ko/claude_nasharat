import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAssertCanManageCalendar, mockGetSchoolFullDetails, mockUpdateCalendarEventRecord } =
  vi.hoisted(() => ({
    mockAssertCanManageCalendar: vi.fn(),
    mockGetSchoolFullDetails: vi.fn(),
    mockUpdateCalendarEventRecord: vi.fn(),
  }));

vi.mock("@/lib/calendar/assertCanManageCalendar", () => ({
  assertCanManageCalendar: mockAssertCanManageCalendar,
}));

vi.mock("@/lib/school/getSchoolFullDetails", () => ({
  getSchoolFullDetails: mockGetSchoolFullDetails,
}));

vi.mock("@/lib/calendar/updateCalendarEventRecord", () => ({
  updateCalendarEventRecord: mockUpdateCalendarEventRecord,
}));

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({}),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { updateCalendarEventAction } from "./updateCalendarEventAction";

describe("updateCalendarEventAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates calendar event successfully", async () => {
    mockAssertCanManageCalendar.mockResolvedValue({
      schoolId: "sch-1",
      profileId: "usr-1",
    });

    mockGetSchoolFullDetails.mockResolvedValue({
      working_days: [0, 1, 2, 3, 4],
    });

    mockUpdateCalendarEventRecord.mockResolvedValue({
      success: true,
    });

    const formData = new FormData();
    formData.append("event_id", "evt-123");
    formData.append("title_ar", "تحديث فعالية");
    formData.append("starts_at", "2026-11-23T09:00:00");
    formData.append("ends_at", "2026-11-23T11:00:00");

    const result = await updateCalendarEventAction(formData);

    expect(result.success).toBe(true);
  });

  it("fails if event_id is missing", async () => {
    mockAssertCanManageCalendar.mockResolvedValue({
      schoolId: "sch-1",
      profileId: "usr-1",
    });

    const formData = new FormData();
    formData.append("title_ar", "تحديث");

    const result = await updateCalendarEventAction(formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Event ID is required");
  });
});
