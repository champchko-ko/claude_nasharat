"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase";
import { assertCanCreateMaintenance } from "@/lib/maintenance/assertCanCreateMaintenance";
import { parseMaintenanceFormData } from "@/lib/validation/parseMaintenanceFormData";
import { createMaintenanceRecord } from "@/lib/maintenance/createMaintenanceRecord";
import { insertMaintenanceUpdate } from "@/lib/maintenance/insertMaintenanceUpdate";
import { handleOptionalPhoto } from "@/lib/maintenance/handleOptionalPhoto";
import { assertValidMaintenancePhoto } from "@/lib/maintenance/assertValidMaintenancePhoto";
import { ValidationError } from "@/lib/errors/ValidationError";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { sanitizeError } from "@/lib/errors/sanitizeError";
import { formatActionErrorResult, type ActionResult } from "@/lib/errors/formatActionErrorResult";

export async function createMaintenanceAction(
  formData: FormData,
): Promise<ActionResult<{ requestId: string }>> {
  try {
    const auth = await assertCanCreateMaintenance();
    const { title, description, category, priority, locationId, area, assetRef, photo } =
      parseMaintenanceFormData(formData);

    if (!title || !description) {
      throw new ValidationError("Title and description are required");
    }

    await assertValidMaintenancePhoto(photo);

    const supabase = await createSupabaseServerClient();
    const res = await createMaintenanceRecord(supabase, {
      schoolId: auth.schoolId,
      title,
      description,
      category,
      locationId,
      area,
      assetRef,
      priority,
      reporterId: auth.profileId,
      reporterDepartmentId: auth.departmentId,
    });

    if (res.error || !res.requestId) {
      throw mapDatabaseError(res.error, "Failed to create maintenance ticket");
    }

    const requestId = res.requestId;
    const photoResult = await handleOptionalPhoto(supabase, photo, {
      schoolId: auth.schoolId,
      requestId,
      uploadedBy: auth.profileId,
      kind: "report",
    });

    if (photoResult.error) {
      throw mapDatabaseError(photoResult.error, "Failed to upload maintenance photo");
    }

    await insertMaintenanceUpdate(supabase, {
      requestId,
      schoolId: auth.schoolId,
      authorId: auth.profileId,
      kind: "status_change",
      oldValue: null,
      newValue: "submitted",
      reason: priority === "emergency" ? "Emergency ticket submitted" : "Ticket submitted",
    });

    revalidatePath("/[locale]/maintenance", "page");
    return { success: true, requestId };
  } catch (err: unknown) {
    const appError = sanitizeError(err);
    return formatActionErrorResult(appError);
  }
}
