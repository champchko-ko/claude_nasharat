import type { SupabaseClient } from "@supabase/supabase-js";
import type { MaintenanceStatus } from "@/lib/maintenance/types";
import { NotFoundError } from "@/lib/errors/NotFoundError";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";

export interface TransitionTicket {
  id: string;
  school_id: string;
  status: MaintenanceStatus;
  reporter_id: string;
  assigned_operator_id: string | null;
}

export async function fetchTicketForTransition(
  supabase: SupabaseClient,
  requestId: string,
): Promise<TransitionTicket> {
  const { data: ticket, error: ticketError } = await supabase
    .from("maintenance_requests")
    .select("id, school_id, status, reporter_id, assigned_operator_id")
    .eq("id", requestId)
    .maybeSingle();

  if (ticketError) {
    throw mapDatabaseError(ticketError);
  }

  if (!ticket) {
    throw new NotFoundError("Ticket not found");
  }

  return ticket as TransitionTicket;
}
