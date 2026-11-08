import { createSupabaseAdminClient } from "@/lib/supabase";
import { generateFallbackReferenceNumber } from "./generateFallbackReferenceNumber";

export async function queryAdminSchoolNumber(
  schoolId: string,
  kind: "circular" | "maintenance",
): Promise<string> {
  const admin = createSupabaseAdminClient();
  const { data: adminRefNum, error: adminError } = await admin.rpc("generate_school_number", {
    p_kind: kind,
  });

  if (!adminError && adminRefNum) {
    return adminRefNum;
  }
  return generateFallbackReferenceNumber(kind);
}
