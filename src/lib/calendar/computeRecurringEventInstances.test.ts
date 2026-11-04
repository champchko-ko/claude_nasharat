import { describe, it, expect } from "vitest";
import { computeRecurringEventInstances } from "./computeRecurringEventInstances";

describe("computeRecurringEventInstances", () => {
  it("returns single instance when frequency is none", () => {
    const res = computeRecurringEventInstances({
      startsAt: "2026-11-01T09:00:00.000Z",
      endsAt: "2026-11-01T10:00:00.000Z",
      frequency: "none",
    });

    expect(res).toHaveLength(1);
    expect(res[0].startsAt).toBe("2026-11-01T09:00:00.000Z");
    expect(res[0].endsAt).toBe("2026-11-01T10:00:00.000Z");
  });

  it("returns empty array for invalid or inverted dates", () => {
    const res = computeRecurringEventInstances({
      startsAt: "2026-11-02T09:00:00.000Z",
      endsAt: "2026-11-01T09:00:00.000Z",
      frequency: "weekly",
    });

    expect(res).toEqual([]);
  });

  it("computes weekly recurrence bounded by maxCount", () => {
    const res = computeRecurringEventInstances({
      startsAt: "2026-11-01T09:00:00.000Z",
      endsAt: "2026-11-01T11:00:00.000Z",
      frequency: "weekly",
      maxCount: 4,
    });

    expect(res).toHaveLength(4);
    expect(res[0].startsAt).toBe("2026-11-01T09:00:00.000Z");
    expect(res[1].startsAt).toBe("2026-11-08T09:00:00.000Z");
    expect(res[2].startsAt).toBe("2026-11-15T09:00:00.000Z");
    expect(res[3].startsAt).toBe("2026-11-22T09:00:00.000Z");

    // Preserves 2-hour duration
    const dur0 = new Date(res[0].endsAt).getTime() - new Date(res[0].startsAt).getTime();
    const dur3 = new Date(res[3].endsAt).getTime() - new Date(res[3].startsAt).getTime();
    expect(dur0).toBe(2 * 60 * 60 * 1000);
    expect(dur3).toBe(dur0);
  });

  it("computes daily recurrence bounded by untilDate", () => {
    const res = computeRecurringEventInstances({
      startsAt: "2026-11-01T08:00:00.000Z",
      endsAt: "2026-11-01T09:00:00.000Z",
      frequency: "daily",
      untilDate: "2026-11-03",
    });

    expect(res.length).toBeGreaterThanOrEqual(3);
    expect(new Date(res[0].startsAt).getUTCDate()).toBe(1);
    expect(new Date(res[1].startsAt).getUTCDate()).toBe(2);
    expect(new Date(res[2].startsAt).getUTCDate()).toBe(3);
  });

  it("computes biweekly and monthly occurrences", () => {
    const biweekly = computeRecurringEventInstances({
      startsAt: "2026-11-01T10:00:00.000Z",
      endsAt: "2026-11-01T11:00:00.000Z",
      frequency: "biweekly",
      maxCount: 2,
    });
    expect(biweekly).toHaveLength(2);
    expect(biweekly[1].startsAt).toBe("2026-11-15T10:00:00.000Z");

    const monthly = computeRecurringEventInstances({
      startsAt: "2026-11-01T10:00:00.000Z",
      endsAt: "2026-11-01T11:00:00.000Z",
      frequency: "monthly",
      maxCount: 3,
    });
    expect(monthly).toHaveLength(3);
  });

  it("skips Friday and Saturday when computing daily recurrence", () => {
    // 2026-11-05 is Thursday, Nov 6 is Friday, Nov 7 is Saturday, Nov 8 is Sunday
    const res = computeRecurringEventInstances({
      startsAt: "2026-11-05T08:00:00.000Z",
      endsAt: "2026-11-05T09:00:00.000Z",
      frequency: "daily",
      untilDate: "2026-11-09",
    });

    const days = res.map((item) => new Date(item.startsAt).getUTCDate());
    expect(days).toContain(5); // Thursday
    expect(days).not.toContain(6); // Friday skipped
    expect(days).not.toContain(7); // Saturday skipped
    expect(days).toContain(8); // Sunday
    expect(days).toContain(9); // Monday
  });
});
