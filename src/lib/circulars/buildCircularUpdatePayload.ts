import type {
  CircularPriority,
  CircularResponseType,
  CircularStatus,
  CircularVisibility,
} from "./types";

interface CircularUpdatePayloadInput {
  title: string;
  body: string;
  priority: CircularPriority;
  visibility?: CircularVisibility;
  status?: CircularStatus;
  responseType: CircularResponseType;
  publishAt?: string | null;
  dueAt: string | null;
}

export function buildCircularUpdatePayload(
  params: CircularUpdatePayloadInput,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    title: params.title,
    body: params.body,
    priority: params.priority,
    response_type: params.responseType,
    due_at: params.dueAt,
    updated_at: new Date().toISOString(),
  };

  if (params.visibility) {
    payload.visibility = params.visibility;
  }
  if (params.status) {
    payload.status = params.status;
  }
  if (params.publishAt !== undefined) {
    payload.publish_at = params.publishAt;
  }

  return payload;
}
