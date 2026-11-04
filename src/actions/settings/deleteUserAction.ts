"use server";

import { revalidateSettingsPath } from "@/lib/settings/revalidateSettingsPath";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";
import { resolveSchoolForCaller } from "@/lib/school/resolveSchoolForCaller";
import { executeUserDissociationFallback } from "./executeUserDissociationFallback";
import { assertCanDeleteUser } from "./assertCanDeleteUser";
import { AuthenticationError } from "@/lib/errors/AuthenticationError";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export async function deleteUserAction(userId: string): Promise<ActionResult> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      throw new AuthenticationError("Authentication required");
    }

    const [isOwner, isTargetOwner] = await Promise.all([
      isPlatformOwner(profile.id),
      isPlatformOwner(userId),
    ]);

    const callerSchoolId = profile.school_id ?? (await resolveSchoolForCaller(profile));

    await assertCanDeleteUser(profile.id, userId, isOwner, isTargetOwner, callerSchoolId);

    const admin = createSupabaseAdminClient({ actorId: profile.id });
    await executeUserDissociationFallback(admin, userId, isOwner, callerSchoolId);

    revalidateSettingsPath("users");
    return { success: true };
  } catch (err: unknown) {
    const sanitized = sanitizeError(err, { action: "deleteUserAction", userId });
    return formatActionErrorResult(sanitized);
  }
}
