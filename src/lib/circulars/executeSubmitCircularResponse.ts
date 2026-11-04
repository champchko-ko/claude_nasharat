import type { SupabaseClient } from "@supabase/supabase-js";
import type { CircularResponseStatus, CircularResponseType } from "./types";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { retryResponseWithAdmin } from "./retryResponseWithAdmin";

export interface ExecuteCircularResponseParams {
  supabase: SupabaseClient;
  circularId: string;
  schoolId: string;
  departmentId: string;
  responderId: string;
  responseType: CircularResponseType;
  status: CircularResponseStatus;
  reason?: string | null;
}

export async function executeSubmitCircularResponse({
  supabase,
  circularId,
  schoolId,
  departmentId,
  responderId,
  responseType,
  status,
  reason,
}: ExecuteCircularResponseParams): Promise<void> {
  const trimmedReason = reason?.trim() || null;

  const { error: rpcError } = await supabase.rpc("submit_circular_response", {
    p_circular_id: circularId,
    p_school_id: schoolId,
    p_department_id: departmentId,
    p_response_type: responseType,
    p_status: status,
    p_reason: trimmedReason,
  });

  if (!rpcError) return;

  const retryParams = {
    circularId,
    schoolId,
    departmentId,
    responderId,
    responseType,
    status,
    reason: trimmedReason,
  };

  if (rpcError.code === "PGRST202") {
    await supabase
      .from("circular_responses")
      .update({ is_latest: false })
      .eq("circular_id", circularId)
      .eq("department_id", departmentId);

    const { error: insertError } = await supabase.from("circular_responses").insert({
      circular_id: circularId,
      school_id: schoolId,
      department_id: departmentId,
      responder_id: responderId,
      response_type: responseType,
      status,
      reason: trimmedReason,
      is_latest: true,
    });

    if (!insertError) return;

    if (insertError.code === "23505") {
      await retryResponseWithAdmin(retryParams);
      return;
    }

    throw mapDatabaseError(
      insertError,
      insertError.message || "Failed to submit circular response",
    );
  }

  if (rpcError.code === "23505") {
    await retryResponseWithAdmin(retryParams);
    return;
  }

  throw mapDatabaseError(rpcError, rpcError.message || "Failed to submit circular response");
}
