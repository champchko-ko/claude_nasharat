"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase";
import { assertCanAssignMaintenance } from "@/lib/maintenance/assertCanAssignMaintenance";
import { isActiveSchoolMember } from "@/lib/school/isActiveSchoolMember";
import { parseMaintenanceAssignData } from "@/lib/validation/parseMaintenanceAssignData";
import { saveMaintenanceAssignment } from "@/lib/maintenance/saveMaintenanceAssignment";
import { dispatchModuleNotification } from "@/lib/notifications/dispatchModuleNotification";
import { fetchAssignableTicket } from "./fetchAssignableTicket";
import { ValidationError } from "@/lib/errors/ValidationError";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export async function assignMaintenanceAction(formData: FormData): Promise<ActionResult> {
  try {
    const auth = await assertCanAssignMaintenance();
    const { requestId, operatorId, priority, notes } = parseMaintenanceAssignData(formData);
    if (!requestId || !operatorId) {
      throw new ValidationError("Request ID and Operator are required");
    }

    const supabase = await createSupabaseServerClient();
    const ticket = await fetchAssignableTicket(supabase, requestId, auth.schoolId);

    // The operator id comes from the client. Reject a user from another
    // tenant before writing the assignment (audit finding M-8).
    if (!(await isActiveSchoolMember(supabase, operatorId, auth.schoolId))) {
      throw new ValidationError("The selected operator does not belong to this school");
    }

    const res = await saveMaintenanceAssignment(supabase, {
      requestId,
      schoolId: auth.schoolId,
      operatorId,
      assignedBy: auth.profileId,
      currentStatus: ticket.status,
      currentOperatorId: ticket.assigned_operator_id,
      priority,
      currentPriority: ticket.priority,
      notes,
    });

    if (res.error) {
      throw mapDatabaseError(res.error, "Failed to assign ticket");
    }

    if (operatorId && operatorId !== ticket.assigned_operator_id) {
      void dispatchModuleNotification({
        recipientUserIds: [operatorId],
        schoolId: auth.schoolId,
        type: "maintenance",
        title: "maintenance_assigned",
        body: "maintenance_assigned",
        entityType: "maintenance_request",
        entityId: requestId,
      });
    }

    revalidatePath("/[locale]/maintenance", "page");
    revalidatePath(`/[locale]/maintenance/${requestId}`, "page");
    return { success: true };
  } catch (err: unknown) {
    const appError = sanitizeError(err);
    return formatActionErrorResult(appError);
  }
}
