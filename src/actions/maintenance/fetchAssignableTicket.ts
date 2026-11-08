import type { SupabaseClient } from "@supabase/supabase-js";
import type { MaintenanceStatus, MaintenancePriority } from "@/lib/maintenance/types";
import { NotFoundError } from "@/lib/errors/NotFoundError";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";

export interface AssignableTicket {
  id: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  assigned_operator_id: string | null;
}

export async function fetchAssignableTicket(
  supabase: SupabaseClient,
  requestId: string,
  schoolId: string,
): Promise<AssignableTicket> {
  const { data: ticket, error: ticketError } = await supabase
    .from("maintenance_requests")
    .select("id, status, priority, assigned_operator_id")
    .eq("id", requestId)
    .maybeSingle();

  if (ticketError) {
    throw mapDatabaseError(ticketError);
  }

  void schoolId;
  if (!ticket) {
    throw new NotFoundError("Ticket not found");
  }

  return ticket as unknown as AssignableTicket;
}
