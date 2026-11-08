export type MaintenancePriority = "emergency" | "urgent" | "medium" | "deferrable";

export type MaintenanceStatus =
  | "submitted"
  | "triaged"
  | "assigned"
  | "in_progress"
  | "waiting_for_parts"
  | "resolved"
  | "closed"
  | "reopened"
  | "rejected";

export type MaintenanceCategory =
  "electrical" | "plumbing" | "hvac" | "carpentry" | "cleaning" | "it" | "safety" | "other";

export interface MaintenanceRequestRow {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  category: string;
  location_id: string | null;
  area: string | null;
  asset_ref: string | null;
  reporter_id: string;
  reporter_department_id: string | null;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  assigned_operator_id: string | null;
  target_response_at: string | null;
  target_resolution_at: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  closed_by: string | null;
  reopen_reason: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  reporter?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  assigned_operator?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  location?: {
    id: string;
    building: string;
    floor: string | null;
    room: string | null;
  } | null;
  department?: {
    id: string;
    name_ar: string;
    name_en: string;
  } | null;
}

export interface MaintenanceUpdateRow {
  id: string;
  request_id: string;
  author_id: string;
  kind: "note" | "status_change" | "priority_change" | "assignment";
  old_value: string | null;
  new_value: string | null;
  reason: string | null;
  created_at: string;
  author?: {
    id: string;
    full_name: string;
  } | null;
}

export interface MaintenanceAttachmentRow {
  id: string;
  request_id: string;
  kind: "report" | "evidence";
  path: string;
  mime: string | null;
  size_bytes: number | null;
  uploaded_by: string;
  created_at: string;
  public_url?: string;
}
