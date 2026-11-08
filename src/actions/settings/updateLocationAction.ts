"use server";

import { revalidateSettingsPath } from "@/lib/settings/revalidateSettingsPath";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { hasPermission } from "@/lib/rbac/hasPermission";
import { parseLocationInput } from "@/lib/school/parseLocationInput";
import { AuthenticationError } from "@/lib/errors/AuthenticationError";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";
import { ValidationError } from "@/lib/errors/ValidationError";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export async function updateLocationAction(
  locationId: string,
  building: string,
  floor: string | null,
  room: string | null,
  kind: string,
): Promise<ActionResult> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      throw new AuthenticationError("No school associated with profile");
    }

    const allowed = await hasPermission("settings.school.update");
    if (!allowed) {
      throw new ForbiddenError("Unauthorized");
    }

    const payload = parseLocationInput(building, floor, room, kind);
    if (!payload.building) {
      throw new ValidationError("Building is required");
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("locations")
      .update(payload)
      .eq("id", locationId);

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
