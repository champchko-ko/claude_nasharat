import { createSupabaseServerClient } from "@/lib/supabase";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import type { NotificationRow } from "./types";

export async function getUserNotifications(limit = 50): Promise<NotificationRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data: userRes, error: userError } = await supabase.auth.getUser();
  if (userError || !userRes?.user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, user_id, school_id, type, title, body, entity_type, entity_id, read_at, created_at",
    )
    .eq("user_id", userRes.user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw mapDatabaseError(error);
  }

  return (data as NotificationRow[]) ?? [];
}
