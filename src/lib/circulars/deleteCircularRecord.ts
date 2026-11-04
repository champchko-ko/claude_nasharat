import type { SupabaseClient } from "@supabase/supabase-js";

export async function deleteCircularRecord(
  supabase: SupabaseClient,
  circularId: string,
): Promise<{ success: boolean; error?: string }> {
  // Read the attachments first so the private objects are removed with their
  // rows. A storage failure aborts the delete: deleting only the row would
  // leave an orphaned object in a private bucket (H-16).
  const { data: attachments, error: readError } = await supabase
    .from("circular_attachments")
    .select("path")
    .eq("circular_id", circularId);

  if (readError) {
    return { success: false, error: readError.message };
  }

  if (attachments && attachments.length > 0) {
    const { error: removeError } = await supabase.storage
      .from("circular-attachments")
      .remove(attachments.map((a) => a.path));

    if (removeError) {
      return {
        success: false,
        error: `Could not delete stored attachments: ${removeError.message}`,
      };
    }
  }

  // `.select()` exposes the affected rows, so a delete that matched nothing is
  // reported as a failure instead of a silent success.
  const { data: deleted, error } = await supabase
    .from("circulars")
    .delete()
    .eq("id", circularId)
    .select("id")
    .maybeSingle();

  if (error) return { success: false, error: error.message };
  if (!deleted) return { success: false, error: "Circular not found or not permitted" };
  return { success: true };
}
