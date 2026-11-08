import type { SupabaseClient } from "@supabase/supabase-js";

export async function insertMaintenanceUpdate(
  supabase: SupabaseClient,
  params: {
    requestId: string;
    schoolId: string;
    authorId: string;
    kind: "note" | "status_change" | "priority_change" | "assignment";
    oldValue?: string | null;
    newValue?: string | null;
    reason?: string | null;
  },
): Promise<{ error?: string }> {
  const { error } = await supabase.from("maintenance_updates").insert({
    request_id: params.requestId,
    author_id: params.authorId,
    kind: params.kind,
    old_value: params.oldValue ?? null,
    new_value: params.newValue ?? null,
    reason: params.reason ?? null,
  });

  if (error) return { error: error.message };
  return {};
}
