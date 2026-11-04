"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase";
import { assertCanManageCalendar } from "@/lib/calendar/assertCanManageCalendar";
import { getSchoolFullDetails } from "@/lib/school/getSchoolFullDetails";
import { parseCalendarFormData } from "@/lib/validation/parseCalendarFormData";
import { assertValidCalendarInput } from "@/lib/calendar/assertValidCalendarInput";
import { computeRecurringEventInstances } from "@/lib/calendar/computeRecurringEventInstances";
import { createCalendarEventSeries } from "@/lib/calendar/createCalendarEventSeries";
import { uploadCalendarImage } from "@/lib/calendar/uploadCalendarImage";
import { ValidationError } from "@/lib/errors/ValidationError";
import { DatabaseError } from "@/lib/errors/DatabaseError";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export async function createCalendarEventAction(
  formData: FormData,
): Promise<ActionResult<{ eventId: string }>> {
  try {
    const auth = await assertCanManageCalendar();
    const schoolDetails = await getSchoolFullDetails(auth.schoolId).catch(() => null);
    const data = parseCalendarFormData(formData);
    const validationError = assertValidCalendarInput(data, schoolDetails?.working_days);
    if (validationError) {
      throw new ValidationError(validationError);
    }

    const supabase = await createSupabaseServerClient();
    let imagePath: string | null = null;

    if (data.image) {
      const uploadRes = await uploadCalendarImage(supabase, data.image, auth.schoolId);
      if (uploadRes.error) {
        throw mapDatabaseError(uploadRes.error, "Failed to upload calendar image");
      }
      imagePath = uploadRes.path ?? null;
    }

    const instances = computeRecurringEventInstances({
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      frequency: data.recurrenceFreq,
      untilDate: data.recurrenceUntil,
      maxCount: data.recurrenceCount,
      workingDays: schoolDetails?.working_days,
    });

    const res = await createCalendarEventSeries(supabase, {
      schoolId: auth.schoolId,
      titleAr: data.titleAr,
      titleEn: data.titleEn,
      description: data.description,
      category: data.category,
      allDay: data.allDay,
      visibility: data.visibility,
      location: data.location,
      imagePath,
      createdBy: auth.profileId,
      instances,
    });

    if (res.error) {
      throw mapDatabaseError(res.error, "Failed to create calendar event");
    }
    if (!res.firstEventId) {
      throw new DatabaseError("Failed to create calendar event");
    }

    revalidatePath("/[locale]/calendar", "page");
    revalidatePath("/[locale]", "page");
    return { success: true, eventId: res.firstEventId };
  } catch (err: unknown) {
    const appError = sanitizeError(err);
    return formatActionErrorResult(appError);
  }
}
