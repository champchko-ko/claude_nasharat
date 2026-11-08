import { createSupabaseAdminClient } from "@/lib/supabase";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import type { CircularResponseStatus, CircularResponseType } from "./types";

export interface RetryResponseAdminParams {
  circularId: string;
  schoolId: string;
  departmentId: string;
  responderId: string;
  responseType: CircularResponseType;
  status: CircularResponseStatus;
  reason?: string | null;
}

export async function retryResponseWithAdmin(params: RetryResponseAdminParams): Promise<void> {
  const admin = createSupabaseAdminClient({
    actorId: params.responderId,
    actorLabel: "submit-circular-response-admin-retry",
  });

  await admin
    .from("circular_responses")
    .update({ is_latest: false, updated_at: new Date().toISOString() })
    .eq("circular_id", params.circularId)
    .eq("department_id", params.departmentId);

  const { error } = await admin.from("circular_responses").insert({
    circular_id: params.circularId,
    department_id: params.departmentId,
    responder_id: params.responderId,
    response_type: params.responseType,
    status: params.status,
    reason: params.reason,
    is_latest: true,
  });

  if (error) {
    throw mapDatabaseError(error, error.message || "Failed to submit circular response");
  }
}
