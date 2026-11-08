import type { SupabaseClient } from "@supabase/supabase-js";
import { logError } from "@/lib/logger";
import type { CircularInsertParams } from "./types";

/**
 * Inserts one circular row.
 *
 * The visibility column is written exactly as requested and the write is
 * attempted once. A check-constraint violation is reported to the caller
 * instead of being rewritten into a different value: migration 0064 aligned
 * the column with the 'public' | 'internal' contract, so a failure here means
 * the schema drifted again and has to stay visible rather than be papered over
 * with a fallback value.
 */
export async function insertCircularRecord(
  supabase: SupabaseClient,
  params: CircularInsertParams,
  refNum: string,
): Promise<{ circularId?: string; error?: string }> {
  const { data, error } = await supabase
    .from("circulars")
    .insert({
      ref_number: refNum,
      title: params.title,
      body: params.body,
      priority: params.priority,
      visibility: params.visibility ?? "internal",
      status: "draft",
      response_type: params.responseType,
      due_at: params.dueAt,
      created_by: params.createdBy,
    })
    .select("id")
    .single();

  if (error) {
    logError(error, {
      scope: "insertCircularRecord",
      schoolId: params.schoolId,
      refNum,
      visibility: params.visibility ?? "internal",
    });
    return { error: error.message };
  }

  if (!data?.id) {
    return { error: "Failed to create circular" };
  }

  return { circularId: data.id };
}
