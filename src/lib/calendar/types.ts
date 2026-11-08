import type { CircularRow } from "@/lib/circulars/types";

export type CalendarVisibility = "public" | "internal";

export type CalendarStatus = "draft" | "published" | "cancelled" | "archived";

export type CalendarCategory =
  "event" | "academic" | "exam" | "holiday" | "meeting" | "activity" | "other";

export type CalendarRecurrenceFrequency = "none" | "daily" | "weekly" | "biweekly" | "monthly";

export interface CalendarEventRow {
  id: string;
  title_ar: string;
  title_en: string | null;
  description: string | null;
  category: CalendarCategory;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  visibility: CalendarVisibility;
  status: CalendarStatus;
  location: string | null;
  image_path: string | null;
  created_by: string;
  published_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    full_name: string;
  } | null;
}

export type UnifiedCalendarItem =
  | {
      kind: "event";
      id: string;
      date: string;
      event: CalendarEventRow;
    }
  | {
      kind: "circular";
      id: string;
      date: string;
      circular: CircularRow;
    };
