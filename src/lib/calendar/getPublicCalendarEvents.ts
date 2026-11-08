import { createSupabaseServerClient } from "@/lib/supabase";
import type { CalendarEventRow } from "./types";

export async function getPublicCalendarEvents(
  schoolId?: string | null,
  limit = 6,
): Promise<CalendarEventRow[]> {
  if (!schoolId) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("calendar_events")
    .select(
      `
      id, title_ar, title_en, description, category,
      starts_at, ends_at, all_day, visibility, status, location,
      image_path, created_by, published_at, cancelled_at, created_at, updated_at
    `,
    )
    .eq("visibility", "public")
    .eq("status", "published")
    .gte("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data as unknown as CalendarEventRow[];
}
