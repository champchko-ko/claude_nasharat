"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { parseAchievementFormData } from "@/lib/validation/parseAchievementFormData";
import { createAchievementRecord } from "@/lib/achievements/createAchievementRecord";
import { uploadCalendarImage } from "@/lib/calendar/uploadCalendarImage";
import { assertCanRegisterAchievement } from "./assertCanRegisterAchievement";
import { ValidationError } from "@/lib/errors/ValidationError";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export async function createAchievementAction(
  formData: FormData,
): Promise<ActionResult<{ achievementId: string }>> {
  try {
    const profile = await getCurrentProfile();
    const data = parseAchievementFormData(formData);
    const auth = await assertCanRegisterAchievement(profile, data.departmentId);

    if (!data.titleAr) {
      throw new ValidationError("Achievement title in Arabic is required");
    }

    const supabase = await createSupabaseServerClient();
    let imagePath: string | null = null;
    if (data.image) {
      const uploadRes = await uploadCalendarImage(
        supabase,
        data.image,
        auth.schoolId,
        "achievements",
      );
      if (uploadRes.error) {
        throw mapDatabaseError(uploadRes.error, "Failed to upload achievement image");
      }
      imagePath = uploadRes.path ?? null;
    }

    const res = await createAchievementRecord(supabase, {
      schoolId: auth.schoolId,
      departmentId: data.departmentId,
      titleAr: data.titleAr,
      titleEn: data.titleEn,
      description: data.description,
      category: data.category,
      dateAchieved: data.dateAchieved,
      visibility: data.visibility,
      imagePath,
      createdBy: auth.profileId,
    });

    if (res.error) {
      throw mapDatabaseError(res.error, "Failed to create achievement");
    }

    revalidatePath("/[locale]/achievements", "page");
    revalidatePath("/[locale]/dashboard", "page");
    return { success: true, achievementId: res.id };
  } catch (err: unknown) {
    const appError = sanitizeError(err);
    return formatActionErrorResult(appError);
  }
}
