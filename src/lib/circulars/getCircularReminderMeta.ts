import type { SupabaseClient } from "@supabase/supabase-js";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";

export async function getCircularReminderMeta(
  supabase: SupabaseClient,
  circularId?: string | null,
): Promise<{ title: string; ref: string }> {
  if (!circularId) {
    return { title: "", ref: "" };
  }

  const { data: circ, error } = await supabase
    .from("circulars")
    .select("title, ref_number")
    .eq("id", circularId)
    .maybeSingle();

  if (error) {
    throw mapDatabaseError(error);
  }

  return {
    title: circ?.title ?? "",
    ref: circ?.ref_number ?? "",
  };
}
