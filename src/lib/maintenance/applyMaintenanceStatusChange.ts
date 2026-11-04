import type { SupabaseClient } from "@supabase/supabase-js";
import { buildStatusUpdatePayload } from "./buildStatusUpdatePayload";
import { handleOptionalPhoto } from "./handleOptionalPhoto";
import { assertValidMaintenancePhoto } from "./assertValidMaintenancePhoto";
import { insertMaintenanceUpdate } from "./insertMaintenanceUpdate";
import { mapDatabaseError } from "../errors/mapDatabaseError";
import { NotFoundError } from "../errors/NotFoundError";
import type { MaintenanceStatus } from "./types";

export async function applyMaintenanceStatusChange(
  supabase: SupabaseClient,
  params: {
    requestId: string;
    schoolId: string;
    userId: string;
    targetStatus: string;
    oldStatus: string;
    reason?: string | null;
    evidencePhoto?: File | null;
  },
): Promise<void> {
  const { requestId, schoolId, userId, targetStatus, oldStatus, reason, evidencePhoto } = params;

  await assertValidMaintenancePhoto(evidencePhoto ?? null);

  const photoResult = await handleOptionalPhoto(supabase, evidencePhoto ?? null, {
    schoolId,
    requestId,
    uploadedBy: userId,
    kind: "evidence",
  });

  if (photoResult.error) {
    throw new Error(photoResult.error);
  }

  const updatePayload = buildStatusUpdatePayload({
    targetStatus: targetStatus as MaintenanceStatus,
    userId,
    reason,
  });
  const { data: updatedRows, error: updateError } = await supabase
    .from("maintenance_requests")
    .update(updatePayload)
    .eq("id", requestId)
    .eq("school_id", schoolId)
    .select("id");

  if (updateError) {
    throw mapDatabaseError(updateError);
  }

  if (!updatedRows || updatedRows.length === 0) {
    throw new NotFoundError("Maintenance request not found or unauthorized");
  }

  const logResult = await insertMaintenanceUpdate(supabase, {
    requestId,
    schoolId,
    authorId: userId,
    kind: "status_change",
    oldValue: oldStatus,
    newValue: targetStatus,
    reason,
  });

  if (logResult.error) {
    throw new Error(logResult.error);
  }
}
