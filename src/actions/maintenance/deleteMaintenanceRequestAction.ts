"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";
import { hasPermission } from "@/lib/rbac/hasPermission";
import { deleteMaintenanceRequestRecord } from "@/lib/maintenance/deleteMaintenanceRequestRecord";
import { AuthenticationError } from "@/lib/errors/AuthenticationError";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export async function deleteMaintenanceRequestAction(requestId: string): Promise<ActionResult> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      throw new AuthenticationError("Authentication required");
    }

    const isOwner = await isPlatformOwner(profile.id);
    if (!isOwner) {
      const canDelete =
        (await hasPermission("maintenance.close")) || (await hasPermission("users.manage"));
      if (!canDelete) {
        throw new ForbiddenError("Unauthorized to delete maintenance request");
      }
    }

    const supabase = isOwner
      ? createSupabaseAdminClient({ actorId: profile.id })
      : await createSupabaseServerClient();

    const res = await deleteMaintenanceRequestRecord(supabase, requestId);
    if (!res.success) {
      throw mapDatabaseError(res.error, "Failed to delete maintenance request");
    }

    revalidatePath("/[locale]/maintenance", "page");
    revalidatePath(`/[locale]/maintenance/${requestId}`, "page");
    return { success: true };
  } catch (err: unknown) {
    const appError = sanitizeError(err);
    return formatActionErrorResult(appError);
  }
}
