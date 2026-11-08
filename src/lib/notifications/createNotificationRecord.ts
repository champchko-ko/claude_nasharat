import type { SupabaseClient } from "@supabase/supabase-js";
import { isNotificationThrottled } from "./isNotificationThrottled";
import type { CreateNotificationInput } from "./types";

export async function createNotificationRecord(
  supabase: SupabaseClient,
  input: CreateNotificationInput,
) {
  const isThrottled = await isNotificationThrottled(supabase, input);
  if (isThrottled) {
    return { skipped: true, id: null };
  }

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message, id: null };
  }

  return { success: true, id: data.id };
}
