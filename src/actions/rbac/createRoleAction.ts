"use server";

import { revalidateSettingsPath } from "@/lib/settings/revalidateSettingsPath";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";
import {
  sanitizeError,
  formatActionErrorResult,
  AuthenticationError,
  ForbiddenError,
  mapDatabaseError,
  type ActionResult,
} from "@/lib/errors";
import { insertRoleRow } from "./insertRoleRow";
import { validateCreateRoleInput } from "./validateCreateRoleInput";

export async function createRoleAction(
  name: string,
  key: string,
  permissionKeys: string[],
): Promise<ActionResult> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      throw new AuthenticationError("User is not authenticated");
    }

    const isOwner = await isPlatformOwner(profile.id);
    if (!isOwner) {
      throw new ForbiddenError("Only the owner can create roles");
    }

    const { trimmedName, trimmedKey } = validateCreateRoleInput(name, key);

    const supabase = await createSupabaseServerClient();
    const res = await insertRoleRow(supabase, {
      name: trimmedName,
      key: trimmedKey,
      permissionKeys,
    });

    if (!res.success) {
      throw mapDatabaseError(res.error, "Failed to create role");
    }

    revalidateSettingsPath("users");
    return { success: true };
  } catch (err: unknown) {
    const sanitized = sanitizeError(err, { action: "createRoleAction", roleKey: key });
    return formatActionErrorResult(sanitized);
  }
}
