"use server";

import { revalidateSettingsPath } from "@/lib/settings/revalidateSettingsPath";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";
import { assertCanUpdateRoleRecord } from "./assertCanUpdateRoleRecord";
import { syncRolePermissions } from "./syncRolePermissions";
import {
  sanitizeError,
  formatActionErrorResult,
  AuthenticationError,
  ForbiddenError,
  ValidationError,
  mapDatabaseError,
  type ActionResult,
} from "@/lib/errors";

export async function updateRoleAction(
  roleId: string,
  name: string,
  permissionKeys: string[],
): Promise<ActionResult> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      throw new AuthenticationError("User is not authenticated");
    }

    const isOwner = await isPlatformOwner(profile.id);
    if (!isOwner) {
      throw new ForbiddenError("Only the platform owner can update roles and permissions");
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new ValidationError("Role name is required");
    }

    const supabase = await createSupabaseServerClient();
    await assertCanUpdateRoleRecord(supabase, roleId, profile.school_id, isOwner);

    const { error: updateError } = await supabase
      .from("roles")
      .update({ name: trimmedName })
      .eq("id", roleId);

    if (updateError) {
      throw mapDatabaseError(updateError);
    }

    await syncRolePermissions(supabase, roleId, permissionKeys);

    revalidateSettingsPath("users");
    return { success: true };
  } catch (err: unknown) {
    const appError = sanitizeError(err);
    return formatActionErrorResult(appError);
  }
}
