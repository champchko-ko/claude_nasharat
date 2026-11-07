import type { SupabaseClient } from "@supabase/supabase-js";
import { NotFoundError } from "@/lib/errors/NotFoundError";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";

export async function verifyTargetDeletable(admin: SupabaseClient, userId: string): Promise<void> {
  const { data: targetProfile, error: targetError } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (targetError) {
    throw mapDatabaseError(targetError);
  }
  if (!targetProfile) {
    throw new NotFoundError("User not found");
  }
}
