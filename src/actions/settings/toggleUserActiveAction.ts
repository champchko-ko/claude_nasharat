"use server";

import { revalidateSettingsPath } from "@/lib/settings/revalidateSettingsPath";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";
import { resolveSchoolForCaller } from "@/lib/school/resolveSchoolForCaller";
import { assertNotLastActiveSchoolAdmin } from "@/lib/school/assertNotLastActiveSchoolAdmin";
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

    const callerSchoolId = profile.school_id ?? (await resolveSchoolForCaller(profile));

    await assertCanToggleUserActive(
      profile.id,
      targetUserId,
      isOwner,
      isTargetOwner,
      callerSchoolId,
    );

    const admin = createSupabaseAdminClient({ actorId: profile.id });

    if (currentStatus && !isOwner) {
      await assertNotLastActiveSchoolAdmin(admin, targetUserId);
    }

    const updateQuery = admin
      .from("profiles")
      .update({ is_active: !currentStatus })
      .eq("id", targetUserId);

    if (!isOwner && callerSchoolId) {
      updateQuery.eq("school_id", callerSchoolId);
    }

    const { data: updated, error } = await updateQuery.select("id").maybeSingle();

    if (error) {
      throw mapDatabaseError(error);
    }

    if (!updated) {
      throw new NotFoundError("User not found in this school");
    }

    revalidateSettingsPath("users");
    return { success: true };
  } catch (err: unknown) {
    const sanitized = sanitizeError(err, { action: "toggleUserActiveAction", targetUserId });
    return formatActionErrorResult(sanitized);
  }
}
