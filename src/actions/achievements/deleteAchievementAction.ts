"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { assertCanRegisterAchievement } from "./assertCanRegisterAchievement";
import { deleteAchievementRecord } from "@/lib/achievements/deleteAchievementRecord";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export async function deleteAchievementAction(achievementId: string): Promise<ActionResult> {
  try {
    const profile = await getCurrentProfile();
    const auth = await assertCanRegisterAchievement(profile);
    const supabase = await createSupabaseServerClient();
    const res = await deleteAchievementRecord(supabase, achievementId, auth.schoolId);

    if (res.error) {
      throw mapDatabaseError(res.error, "Failed to delete achievement");
    }

    revalidatePath("/[locale]/achievements", "page");
    revalidatePath("/[locale]/dashboard", "page");
    return { success: true };
  } catch (err: unknown) {
    const appError = sanitizeError(err);
    return formatActionErrorResult(appError);
  }
}
