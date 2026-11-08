export type CircularPriority = "low" | "normal" | "high" | "urgent";

export type CircularVisibility = "public" | "internal";

export type CircularStatus =
  "draft" | "published" | "in_progress" | "completed" | "overdue" | "archived" | "cancelled";

export type CircularResponseType = "acknowledgement" | "approval" | "task";

export type CircularResponseStatus =
  "pending" | "acknowledged" | "approved" | "rejected" | "completed" | "not_applicable";

export type CircularRow = {
  id: string;
  ref_number: string;
  title: string;
  body: string;
  category: string;
  priority: CircularPriority;
  status: CircularStatus;
  visibility: CircularVisibility;
  response_type: CircularResponseType;
  response_instructions: string | null;
  allow_response_revision: boolean;
  publish_at: string | null;
  due_at: string | null;
  created_by: string;
  closed_at: string | null;
  created_at: string;
  targets?: CircularTargetRow[];
  attachments?: CircularAttachmentRow[];
};

export type CircularAttachmentRow = {
  id: string;
  circular_id: string;
  path: string;
  mime: string | null;
  size_bytes: number | null;
  uploaded_by: string;
  created_at: string;
  public_url?: string;
};

export type CircularTargetRow = {
  id: string;
  circular_id?: string;
  department_id: string | null;
  department_name?: string | null;
  role_key: string | null;
  departments?: { id?: string; name_ar: string; name_en: string } | null;
};

export type CircularResponseRow = {
  id: string;
  circular_id: string;
  department_id: string;
  department_name?: string | null;
  responder_id: string;
  responder_name?: string | null;
  response_type: CircularResponseType;
  status: CircularResponseStatus;
  reason: string | null;
  is_latest: boolean;
  submitted_at: string;
};

export type CircularInsertParams = {
  schoolId: string;
  title: string;
  body: string;
  priority: CircularPriority;
  visibility?: CircularVisibility;
  responseType: CircularResponseType;
  dueAt: string | null;
  createdBy: string;
};
