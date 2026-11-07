"use server";

import { revalidateSettingsPath } from "@/lib/settings/revalidateSettingsPath";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";
import { assertCanToggleUserActive } from "./assertCanToggleUserActive";
import {
  sanitizeError,
  formatActionErrorResult,
  AuthenticationError,
  NotFoundError,
  mapDatabaseError,
  type ActionResult,
} from "@/lib/errors";

export async function toggleUserActiveAction(
  targetUserId: string,
  currentStatus: boolean,
): Promise<ActionResult> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      throw new AuthenticationError("Authentication required");
    }

    const [isOwner, isTargetOwner] = await Promise.all([
      isPlatformOwner(profile.id),
      isPlatformOwner(targetUserId),
    ]);

    await assertCanToggleUserActive(profile.id, targetUserId, isOwner, isTargetOwner);

    const admin = createSupabaseAdminClient({ actorId: profile.id });
    const { data: updated, error } = await admin
      .from("profiles")
      .update({ is_active: !currentStatus })
      .eq("id", targetUserId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw mapDatabaseError(error);
    }

    if (!updated) {
      throw new NotFoundError("User not found");
    }

    revalidateSettingsPath("users");
    return { success: true };
  } catch (err: unknown) {
    const sanitized = sanitizeError(err, { action: "toggleUserActiveAction", targetUserId });
    return formatActionErrorResult(sanitized);
  }
}
