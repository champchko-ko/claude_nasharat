"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { hasPermission } from "@/lib/rbac/hasPermission";
import { dispatchModuleNotification } from "@/lib/notifications/dispatchModuleNotification";
import { AuthenticationError } from "@/lib/errors/AuthenticationError";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export async function publishCircularAction(circularId: string): Promise<ActionResult> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) throw new AuthenticationError("Not authenticated");

    const allowed = await hasPermission("circular.publish");
    if (!allowed) {
      throw new ForbiddenError("Unauthorized");
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("circulars")
      .update({
        status: "published",
        publish_at: new Date().toISOString(),
      })
      .eq("id", circularId)
      ;

    if (error) {
      throw mapDatabaseError(error);
    }

    const { data: targets, error: targetsError } = await supabase
      .from("circular_targets")
      .select("department:departments(head_profile_id)")
      .eq("circular_id", circularId);

    if (targetsError) {
      throw mapDatabaseError(targetsError);
    }

    type TargetHead = { department: { head_profile_id: string | null } | null };
    const headIds = ((targets ?? []) as unknown as TargetHead[])
      .map((t) => t.department?.head_profile_id)
      .filter((id): id is string => Boolean(id) && id !== profile.id);

    if (headIds.length > 0) {
      void dispatchModuleNotification({
        recipientUserIds: headIds,
        schoolId: null,
        type: "circular",
        title: "circular_published",
        body: "circular_published",
        entityType: "circular",
        entityId: circularId,
      });
    }

    revalidatePath("/[locale]/circulars", "page");
    revalidatePath(`/[locale]/circulars/${circularId}`, "page");
    return { success: true };
  } catch (err: unknown) {
    const appError = sanitizeError(err);
    return formatActionErrorResult(appError);
  }
}
