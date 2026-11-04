import type { SupabaseClient } from "@supabase/supabase-js";
import type { CalendarCategory, CalendarVisibility } from "./types";

export async function updateCalendarEventRecord(
  supabase: SupabaseClient,
  params: {
    eventId: string;
    titleAr: string;
    titleEn: string | null;
    description: string | null;
    category: CalendarCategory;
    startsAt: string;
    endsAt: string;
    allDay: boolean;
    visibility: CalendarVisibility;
    location: string | null;
    imagePath?: string | null;
  },
): Promise<{ error?: string }> {
  const updatePayload: Record<string, unknown> = {
    title_ar: params.titleAr,
    title_en: params.titleEn,
    description: params.description,
    category: params.category,
    starts_at: params.startsAt,
    ends_at: params.endsAt,
    all_day: params.allDay,
    visibility: params.visibility,
    location: params.location,
    updated_at: new Date().toISOString(),
  };

  if (params.imagePath !== undefined) {
    updatePayload.image_path = params.imagePath;
  }

  const { error } = await supabase
    .from("calendar_events")
    .update(updatePayload)
    .eq("id", params.eventId);

  if (error) return { error: error.message };
  return {};
}
