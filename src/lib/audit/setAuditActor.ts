import type { SupabaseClient } from "@supabase/supabase-js";
import { logError } from "@/lib/logger";

export async function setAuditActor(
  supabase: SupabaseClient,
  actorId: string,
  actorLabel?: string | null,
): Promise<void> {
  const { error } = await supabase.rpc("set_audit_actor", {
    p_actor_id: actorId,
    p_actor_label: actorLabel ?? null,
  });

  if (error) {
    logError(error, {
      scope: "setAuditActor",
      actorId,
    });
  }
}
