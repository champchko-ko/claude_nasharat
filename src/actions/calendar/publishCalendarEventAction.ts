"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase";
import { assertCanManageCalendar } from "@/lib/calendar/assertCanManageCalendar";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export async function publishCalendarEventAction(eventId: string): Promise<ActionResult> {
  try {
    const auth = await assertCanManageCalendar();
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("calendar_events")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId)
      .eq("school_id", auth.schoolId);

    if (error) {
      throw mapDatabaseError(error);
    }

    revalidatePath("/[locale]/calendar", "page");
    revalidatePath(`/[locale]/calendar/${eventId}`, "page");
    revalidatePath("/[locale]", "page");
    return { success: true };
  } catch (err: unknown) {
    const appError = sanitizeError(err);
    return formatActionErrorResult(appError);
  }
}
