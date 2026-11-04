import { describe, it, expect } from "vitest";
import { parseCalendarFormData } from "./parseCalendarFormData";

describe("parseCalendarFormData", () => {
  it("parses standard form fields without recurrence", () => {
    const formData = new FormData();
    formData.append("title_ar", "حفل التخرج");
    formData.append("starts_at", "2026-11-01T10:00");
    formData.append("ends_at", "2026-11-01T12:00");

    const parsed = parseCalendarFormData(formData);
    expect(parsed.titleAr).toBe("حفل التخرج");
    expect(parsed.recurrenceFreq).toBe("none");
    expect(parsed.recurrenceUntil).toBeNull();
    expect(parsed.recurrenceCount).toBeUndefined();
  });

  it("parses recurrence fields correctly", () => {
    const formData = new FormData();
    formData.append("title_ar", "اجتماع أسبوعي");
    formData.append("starts_at", "2026-11-01T10:00");
    formData.append("ends_at", "2026-11-01T11:00");
    formData.append("recurrence_freq", "weekly");
    formData.append("recurrence_until", "2026-12-31");
    formData.append("recurrence_count", "8");

    const parsed = parseCalendarFormData(formData);
    expect(parsed.recurrenceFreq).toBe("weekly");
    expect(parsed.recurrenceUntil).toBe("2026-12-31");
    expect(parsed.recurrenceCount).toBe(8);
  });

  it("throws ValidationError when title_ar is missing", () => {
    const formData = new FormData();
    formData.append("starts_at", "2026-11-01T10:00");
    formData.append("ends_at", "2026-11-01T11:00");

    expect(() => parseCalendarFormData(formData)).toThrow();
  });
});
