import type { SupabaseClient } from "@supabase/supabase-js";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { chunkArray } from "./chunkArray";

export interface CircularReportBatchResult {
  targets: Array<{ circular_id: string; department_id: string | null }>;
  responses: Array<{ circular_id: string; department_id: string; status: string }>;
}

export async function fetchCircularReportBatches(
  supabase: SupabaseClient,
  circularIds: readonly string[],
  chunkSize = 100,
): Promise<CircularReportBatchResult> {
  const targets: Array<{ circular_id: string; department_id: string | null }> = [];
  const responses: Array<{ circular_id: string; department_id: string; status: string }> = [];

  if (circularIds.length === 0) {
    return { targets, responses };
  }

  const idBatches = chunkArray(circularIds, chunkSize);

  const targetBatches = await Promise.all(
    idBatches.map(async (batch) => {
      const { data, error } = await supabase
        .from("circular_targets")
        .select("circular_id, department_id")
        .in("circular_id", batch);
      if (error) {
        throw mapDatabaseError(error);
      }
      return (data ?? []) as Array<{ circular_id: string; department_id: string | null }>;
    }),
  );
  for (const batchRows of targetBatches) {
    targets.push(...batchRows);
  }

  const responseBatches = await Promise.all(
    idBatches.map(async (batch) => {
      const { data, error } = await supabase
        .from("circular_responses")
        .select("circular_id, department_id, status")
        .eq("is_latest", true)
        .in("circular_id", batch);
      if (error) {
        throw mapDatabaseError(error);
      }
      return (data ?? []) as Array<{
        circular_id: string;
        department_id: string;
        status: string;
      }>;
    }),
  );
  for (const batchRows of responseBatches) {
    responses.push(...batchRows);
  }

  return { targets, responses };
}
