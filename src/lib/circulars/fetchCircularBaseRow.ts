import type { SupabaseClient } from "@supabase/supabase-js";
import { logError } from "@/lib/logger";
import type { CircularRow } from "./types";

const SELECT_CIRCULAR_WITH_VISIBILITY =
  "id, school_id, ref_number, title, body, category, priority, status, visibility, response_type, response_instructions, allow_response_revision, publish_at, due_at, created_by, closed_at, created_at";

const SELECT_CIRCULAR_WITHOUT_VISIBILITY =
  "id, school_id, ref_number, title, body, category, priority, status, response_type, response_instructions, allow_response_revision, publish_at, due_at, created_by, closed_at, created_at";

export async function fetchCircularBaseRow(
  supabase: SupabaseClient,
  circularId: string,
): Promise<CircularRow | null> {
  const primary = await supabase
    .from("circulars")
    .select(SELECT_CIRCULAR_WITH_VISIBILITY)
    .eq("id", circularId)
    .maybeSingle();

  if (primary.data) {
    return primary.data as CircularRow;
  }

  const err = primary.error;
  // Schema-tolerant read for a database that predates migration 0055. The
  // missing visibility is treated as internal (never as public) and the drift
  // is logged so it does not stay silent.
  if (err && err.code === "42703") {
    logError(err, { scope: "fetchCircularBaseRow.visibilityFallback", circularId });

    const fallback = await supabase
      .from("circulars")
      .select(SELECT_CIRCULAR_WITHOUT_VISIBILITY)
      .eq("id", circularId)
      .maybeSingle();

    return fallback.data ? ({ ...fallback.data, visibility: "internal" } as CircularRow) : null;
  }

  return null;
}
