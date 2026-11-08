import type { SupabaseClient } from "@supabase/supabase-js";
import type { MaintenancePriority } from "./types";
import { insertMaintenanceUpdate } from "./insertMaintenanceUpdate";

export async function saveMaintenanceAssignment(
  supabase: SupabaseClient,
  params: {
    requestId: string;
    schoolId: string;
    operatorId: string;
    assignedBy: string;
    currentStatus: string;
    currentOperatorId: string | null;
    priority?: MaintenancePriority | null;
    currentPriority: string;
    notes?: string | null;
  },
): Promise<{ error?: string }> {
  const { error: deactError } = await supabase
    .from("maintenance_assignments")
    .update({ is_active: false })
    .eq("request_id", params.requestId)
    ;

  if (deactError) return { error: deactError.message };

  const { error: assignError } = await supabase.from("maintenance_assignments").insert({
    request_id: params.requestId,
    operator_id: params.operatorId,
    assigned_by: params.assignedBy,
    is_active: true,
    notes: params.notes ?? null,
  });

  if (assignError) return { error: assignError.message };

  const targetStatus = params.currentStatus === "submitted" ? "assigned" : params.currentStatus;
  // `assigned_operator_id` is written by the `trg_sync_maintenance_assignment`
  // trigger (0048), which owns that column. Writing it here as well created a
  // window where the request named the previous operator during rotation.
  const updatePayload: Record<string, unknown> = {
    status: targetStatus,
    updated_at: new Date().toISOString(),
  };

  if (params.priority && params.priority !== params.currentPriority) {
    updatePayload.priority = params.priority;
  }

  const { error: reqError } = await supabase
    .from("maintenance_requests")
    .update(updatePayload)
    .eq("id", params.requestId)
    ;

  if (reqError) return { error: reqError.message };

  return insertMaintenanceUpdate(supabase, {
    requestId: params.requestId,
    schoolId: params.schoolId,
    authorId: params.assignedBy,
    kind: "assignment",
    oldValue: params.currentOperatorId,
    newValue: params.operatorId,
    reason: params.notes || "Operator assigned",
  });
}
