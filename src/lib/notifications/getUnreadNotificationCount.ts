import { createSupabaseServerClient } from "@/lib/supabase";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { data: userRes, error: userError } = await supabase.auth.getUser();
  if (userError || !userRes?.user) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userRes.user.id)
    .is("read_at", null);

  if (error) {
    throw mapDatabaseError(error);
  }

  if (typeof count !== "number") return 0;
  return count;
}
