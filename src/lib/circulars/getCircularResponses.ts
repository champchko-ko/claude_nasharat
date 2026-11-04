import { createSupabaseServerClient } from "@/lib/supabase";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import type { CircularResponseRow, CircularResponseType, CircularResponseStatus } from "./types";

type ResponseJoinResult = {
  id: string;
  circular_id: string;
  school_id: string;
  department_id: string;
  responder_id: string;
  response_type: CircularResponseType;
  status: CircularResponseStatus;
  reason: string | null;
  is_latest: boolean;
  submitted_at: string;
  departments: { name_ar: string; name_en: string } | null;
  profiles: { full_name: string } | null;
};

export async function getCircularResponses(circularId: string): Promise<CircularResponseRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("circular_responses")
    .select(
      "id, circular_id, school_id, department_id, responder_id, response_type, status, reason, is_latest, submitted_at, departments(name_ar, name_en), profiles(full_name)",
    )
    .eq("circular_id", circularId)
    .eq("is_latest", true)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw mapDatabaseError(error);
  }

  const rawRows = (data as unknown as ResponseJoinResult[]) ?? [];
  return rawRows.map((r) => ({
    id: r.id,
    circular_id: r.circular_id,
    school_id: r.school_id,
    department_id: r.department_id,
    department_name: r.departments?.name_ar || r.departments?.name_en || null,
    responder_id: r.responder_id,
    responder_name: r.profiles?.full_name || null,
    response_type: r.response_type,
    status: r.status,
    reason: r.reason,
    is_latest: r.is_latest,
    submitted_at: r.submitted_at,
  }));
}
