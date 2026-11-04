"use server";

import { revalidateSettingsPath } from "@/lib/settings/revalidateSettingsPath";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { hasPermission } from "@/lib/rbac/hasPermission";
import { AuthenticationError } from "@/lib/errors/AuthenticationError";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export async function toggleLocationStatusAction(
  locationId: string,
  currentStatus: boolean,
): Promise<ActionResult> {
  try {
    const profile = await getCurrentProfile();
    if (!profile?.school_id) {
      throw new AuthenticationError("No school associated with profile");
    }

    const allowed = await hasPermission("settings.school.update", profile.school_id);
    if (!allowed) {
      throw new ForbiddenError("Unauthorized");
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("locations")
      .update({ is_active: !currentStatus })
      .eq("id", locationId)
      .eq("school_id", profile.school_id);

    if (error) {
      throw mapDatabaseError(error);
    }

    revalidateSettingsPath("locations");
    return { success: true };
  } catch (err: unknown) {
    const appError = sanitizeError(err);
    return formatActionErrorResult(appError);
  }
}
