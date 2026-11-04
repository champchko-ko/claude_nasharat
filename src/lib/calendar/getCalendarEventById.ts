import { createSupabaseServerClient } from "@/lib/supabase";
import type { CalendarEventRow } from "./types";

export async function getCalendarEventById(id: string): Promise<CalendarEventRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("calendar_events")
    .select(
      `
      id, school_id, title_ar, title_en, description, category,
      starts_at, ends_at, all_day, visibility, status, location,
      image_path, created_by, published_at, cancelled_at, created_at, updated_at,
      creator:profiles!calendar_events_created_by_fkey(id, full_name)
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as unknown as CalendarEventRow;
}
