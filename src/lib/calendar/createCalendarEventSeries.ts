import type { SupabaseClient } from "@supabase/supabase-js";
import type { CalendarCategory, CalendarVisibility } from "./types";

export interface CreateCalendarSeriesParams {
  schoolId: string;
  titleAr: string;
  titleEn: string | null;
  description: string | null;
  category: CalendarCategory;
  allDay: boolean;
  visibility: CalendarVisibility;
  location: string | null;
  imagePath: string | null;
  createdBy: string;
  instances: Array<{ startsAt: string; endsAt: string }>;
}

export async function createCalendarEventSeries(
  supabase: SupabaseClient,
  params: CreateCalendarSeriesParams,
): Promise<{ eventIds?: string[]; firstEventId?: string; error?: string }> {
  if (!params.instances || params.instances.length === 0) {
    return { error: "No event occurrences specified" };
  }

  const rows = params.instances.map((inst) => ({
    school_id: params.schoolId,
    title_ar: params.titleAr,
    title_en: params.titleEn,
    description: params.description,
    category: params.category,
    starts_at: inst.startsAt,
    ends_at: inst.endsAt,
    all_day: params.allDay,
    visibility: params.visibility,
    status: "draft",
    location: params.location,
    image_path: params.imagePath,
    created_by: params.createdBy,
  }));

  const { data, error } = await supabase.from("calendar_events").insert(rows).select("id");

  if (error) {
    return { error: error.message };
  }

  if (!data || data.length === 0) {
    return { error: "Failed to create calendar event series" };
  }

  const eventIds = data.map((row) => row.id as string);
  return { eventIds, firstEventId: eventIds[0] };
}
