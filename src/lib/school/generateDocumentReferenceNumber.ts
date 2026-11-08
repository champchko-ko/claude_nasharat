import type { SupabaseClient } from "@supabase/supabase-js";
import { queryAdminSchoolNumber } from "./queryAdminSchoolNumber";

export async function generateDocumentReferenceNumber(
  supabase: SupabaseClient,
  schoolId: string,
  kind: "circular" | "maintenance",
): Promise<{ refNum?: string; error?: string }> {
  try {
    const { data: refNum, error: refError } = await supabase.rpc("next_school_number", {
      p_kind: kind,
    });

    if (!refError && refNum) {
      return { refNum };
    }
  } catch {
    // Continue to admin fallback
  }

  const fallbackRef = await queryAdminSchoolNumber(schoolId, kind);
  return { refNum: fallbackRef };
}
