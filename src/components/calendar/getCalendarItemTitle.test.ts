import { describe, expect, it } from "vitest";
import { getCalendarItemTitle } from "./getCalendarItemTitle";
import type { UnifiedCalendarItem } from "@/lib/calendar/types";

describe("getCalendarItemTitle", () => {
  it("returns circular title for circular items", () => {
    const item = {
      kind: "circular",
      circular: {
        title: "Circular Title",
      },
    } as unknown as UnifiedCalendarItem;

    expect(getCalendarItemTitle(item, "en")).toBe("Circular Title");
    expect(getCalendarItemTitle(item, "ar")).toBe("Circular Title");
  });

  it("returns Arabic title for event when locale is ar", () => {
    const item = {
      kind: "event",
      event: {
        title_ar: "عنوان الفعالية",
        title_en: "Event Title",
      },
    } as unknown as UnifiedCalendarItem;

    expect(getCalendarItemTitle(item, "ar")).toBe("عنوان الفعالية");
  });

  it("returns English title for event when locale is en", () => {
    const item = {
      kind: "event",
      event: {
        title_ar: "عنوان الفعالية",
        title_en: "Event Title",
      },
    } as unknown as UnifiedCalendarItem;

    expect(getCalendarItemTitle(item, "en")).toBe("Event Title");
  });

  it("falls back to title_ar when title_en is empty and locale is en", () => {
    const item = {
      kind: "event",
      event: {
        title_ar: "عنوان الفعالية",
        title_en: "",
      },
    } as unknown as UnifiedCalendarItem;

    expect(getCalendarItemTitle(item, "en")).toBe("عنوان الفعالية");
  });
});
