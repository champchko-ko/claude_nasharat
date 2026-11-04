import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CircularPriority,
  CircularResponseType,
  CircularStatus,
  CircularVisibility,
} from "./types";
import { logError } from "@/lib/logger";
import { insertCircularTargets } from "./insertCircularTargets";
import { buildCircularUpdatePayload } from "./buildCircularUpdatePayload";

export async function updateCircularRecord(
  supabase: SupabaseClient,
  params: {
    circularId: string;
    schoolId: string;
    title: string;
    body: string;
    priority: CircularPriority;
    visibility?: CircularVisibility;
    status?: CircularStatus;
    responseType: CircularResponseType;
    publishAt?: string | null;
    dueAt: string | null;
    departmentIds?: string[];
  },
): Promise<{ success: boolean; error?: string }> {
  const updatePayload = buildCircularUpdatePayload(params);

  // A single attempt: the payload is written as built. Retrying without the
  // visibility column would silently discard the requested visibility change
  // and report success, which is exactly the failure mode migration 0064
  // removes.
  const { error } = await supabase
    .from("circulars")
    .update(updatePayload)
    .eq("id", params.circularId);

  if (error) {
    logError(error, {
      scope: "updateCircularRecord",
      circularId: params.circularId,
      schoolId: params.schoolId,
      visibility: params.visibility ?? null,
    });
    return { success: false, error: error.message };
  }

  if (params.departmentIds) {
    const { error: deleteError } = await supabase
      .from("circular_targets")
      .delete()
      .eq("circular_id", params.circularId);

    if (deleteError) {
      return { success: false, error: `Failed to update circular targets: ${deleteError.message}` };
    }

    const insertResult = await insertCircularTargets(
      supabase,
      params.circularId,
      params.schoolId,
      params.departmentIds,
    );

    if (insertResult.error) {
      return { success: false, error: `Failed to update circular targets: ${insertResult.error}` };
    }
  }

  return { success: true };
}
