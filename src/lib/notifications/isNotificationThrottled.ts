import type { SupabaseClient } from "@supabase/supabase-js";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { shouldThrottleNotification } from "./shouldThrottleNotification";
import type { CreateNotificationInput } from "./types";

export async function isNotificationThrottled(
  supabase: SupabaseClient,
  input: CreateNotificationInput,
): Promise<boolean> {
  if (input.skipThrottle || !input.entityType || !input.entityId) {
    return false;
  }

  const { data: existing, error } = await supabase
    .from("notifications")
    .select("created_at")
    .eq("user_id", input.userId)
    .eq("type", input.type)
    .eq("entity_type", input.entityType)
    .eq("entity_id", input.entityId)
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw mapDatabaseError(error);
  }

  if (!existing) return false;
  return shouldThrottleNotification(existing.created_at);
}
