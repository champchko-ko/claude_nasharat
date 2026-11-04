import type { SupabaseClient } from "@supabase/supabase-js";
import type { CircularPriority, CircularResponseType, CircularVisibility } from "./types";
import { generateDocumentReferenceNumber } from "@/lib/school/generateDocumentReferenceNumber";
import { insertCircularRecord } from "./insertCircularRecord";

export async function createCircularRecord(
  supabase: SupabaseClient,
  params: {
    schoolId: string;
    title: string;
    body: string;
    priority: CircularPriority;
    visibility?: CircularVisibility;
    responseType: CircularResponseType;
    dueAt: string | null;
    createdBy: string;
  },
): Promise<{ circularId?: string; error?: string }> {
  const { refNum, error: refError } = await generateDocumentReferenceNumber(
    supabase,
    params.schoolId,
    "circular",
  );

  if (refError || !refNum) {
    return { error: refError ?? "Failed to generate reference number" };
  }

  return insertCircularRecord(supabase, params, refNum);
}
