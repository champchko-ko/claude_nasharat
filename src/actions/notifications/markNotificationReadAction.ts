"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase";
import { AuthenticationError } from "@/lib/errors/AuthenticationError";
import { ValidationError } from "@/lib/errors/ValidationError";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export async function markNotificationReadAction(notificationId: string): Promise<ActionResult> {
  try {
    if (!notificationId) {
      throw new ValidationError("Notification ID is required");
    }

    const supabase = await createSupabaseServerClient();
    const { data: userRes, error: userError } = await supabase.auth.getUser();
    if (userError || !userRes?.user) {
      throw new AuthenticationError("Unauthorized");
    }

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", userRes.user.id);

    if (error) {
      throw mapDatabaseError(error);
    }

    revalidatePath("/[locale]/notifications", "page");
    return { success: true };
  } catch (err: unknown) {
    const appError = sanitizeError(err);
    return formatActionErrorResult(appError);
  }
}
