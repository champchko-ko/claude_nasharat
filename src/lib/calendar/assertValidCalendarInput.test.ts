import { describe, expect, it } from "vitest";
import { assertValidCalendarInput } from "./assertValidCalendarInput";

describe("assertValidCalendarInput", () => {
  it("returns null for a valid event on working days", () => {
    // 2026-11-22 is Sunday
    const res = assertValidCalendarInput({
      titleAr: "فعالية يوم الأحد",
      startsAt: "2026-11-22T08:00:00",
      endsAt: "2026-11-22T10:00:00",
    });
    expect(res).toBeNull();
  });

  it("rejects an event scheduled on Friday", () => {
    // 2026-11-20 is Friday
    const res = assertValidCalendarInput({
      titleAr: "فعالية يوم الجمعة",
      startsAt: "2026-11-20T08:00:00",
      endsAt: "2026-11-20T10:00:00",
    });
    expect(res).toBe("Events cannot be scheduled on weekends (Friday or Saturday)");
  });

  it("rejects an event scheduled on Saturday", () => {
    // 2026-11-21 is Saturday
    const res = assertValidCalendarInput({
      titleAr: "فعالية يوم السبت",
      startsAt: "2026-11-21T08:00:00",
      endsAt: "2026-11-21T10:00:00",
    });
    expect(res).toBe("Events cannot be scheduled on weekends (Friday or Saturday)");
  });

  it("rejects when required fields are missing", () => {
    expect(
      assertValidCalendarInput({
        titleAr: "",
        startsAt: "2026-11-22T08:00:00",
        endsAt: "2026-11-22T10:00:00",
      }),
    ).toBe("Title, start time, and end time are required");
  });

  it("rejects when end date is before start date", () => {
    expect(
      assertValidCalendarInput({
        titleAr: "فعالية",
        startsAt: "2026-11-22T12:00:00",
        endsAt: "2026-11-22T10:00:00",
      }),
    ).toBe("End time must be after or equal to start time");
  });

  it("respects custom workingDays when validating", () => {
    // Custom Mon-Fri: [1, 2, 3, 4, 5]. Friday is working day.
    const res = assertValidCalendarInput(
      {
        titleAr: "فعالية الجمعة",
        startsAt: "2026-11-20T08:00:00",
        endsAt: "2026-11-20T10:00:00",
      },
      [1, 2, 3, 4, 5],
    );
    expect(res).toBeNull();
  });
});
