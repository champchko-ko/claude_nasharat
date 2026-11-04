"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { hasPermission } from "@/lib/rbac/hasPermission";
import { isLegalTransition } from "@/lib/maintenance/isLegalTransition";
import { parseMaintenanceTransitionData } from "@/lib/validation/parseMaintenanceTransitionData";
import { assertCanTransitionStatus } from "@/lib/maintenance/assertCanTransitionStatus";
import { applyMaintenanceStatusChange } from "@/lib/maintenance/applyMaintenanceStatusChange";
import { fetchTicketForTransition } from "./fetchTicketForTransition";
import { AuthenticationError } from "@/lib/errors/AuthenticationError";
import { ForbiddenError } from "@/lib/errors/ForbiddenError";
import { ValidationError } from "@/lib/errors/ValidationError";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export async function updateMaintenanceStatusAction(formData: FormData): Promise<ActionResult> {
  try {
    const profile = await getCurrentProfile();
    if (!profile?.school_id) {
      throw new AuthenticationError("No school associated with profile");
    }

    const { requestId, targetStatus, reason, evidencePhoto } =
      parseMaintenanceTransitionData(formData);
    if (!requestId || !targetStatus) {
      throw new ValidationError("Invalid status transition request");
    }

    const supabase = await createSupabaseServerClient();
    const ticket = await fetchTicketForTransition(supabase, requestId);

    if (!isLegalTransition(ticket.status, targetStatus)) {
      throw new ValidationError(`Illegal transition from ${ticket.status} to ${targetStatus}`);
    }

    const canAssign = await hasPermission("maintenance.assign", profile.school_id, profile.department_id);
    const canClose = await hasPermission("maintenance.close", profile.school_id, profile.department_id);
    const authCheck = assertCanTransitionStatus({
      targetStatus,
      isReporter: ticket.reporter_id === profile.id,
      isAssigned: ticket.assigned_operator_id === profile.id,
      canAssign,
      canClose,
      reason,
    });
    if (!authCheck.ok) {
      throw new ForbiddenError(authCheck.error || "Unauthorized");
    }

    await applyMaintenanceStatusChange(supabase, {
      requestId,
      schoolId: profile.school_id,
      userId: profile.id,
      targetStatus,
      oldStatus: ticket.status,
      reason,
      evidencePhoto,
    });

    revalidatePath("/[locale]/maintenance", "page");
    revalidatePath(`/[locale]/maintenance/${requestId}`, "page");
    return { success: true };
  } catch (err: unknown) {
    const appError = sanitizeError(err);
    return formatActionErrorResult(appError);
  }
}
