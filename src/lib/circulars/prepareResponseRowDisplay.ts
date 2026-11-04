import { formatCircularDate } from "./formatCircularDate";
import { resolveResponseBadgeVariant } from "./resolveResponseBadgeVariant";
import type { DepartmentResponseStatus } from "./getCircularDepartmentStatuses";

export interface ResponseRowDisplay {
  departmentName: string;
  hasResponded: boolean;
  responder: string;
  reason: string;
  formattedDate: string;
  variant: "default" | "destructive" | "secondary";
  label: string;
}

export function prepareResponseRowDisplay(
  item: DepartmentResponseStatus,
  locale: string,
  statusLabels: Record<string, string>,
  awaitingText: string,
  notRespondedText: string,
): ResponseRowDisplay {
  const res = item.response;
  if (!res) {
    return {
      departmentName: item.departmentName,
      hasResponded: false,
      responder: awaitingText,
      reason: "—",
      formattedDate: "—",
      variant: "destructive",
      label: notRespondedText,
    };
  }

  const rawLabel = statusLabels[res.status];
  return {
    departmentName: item.departmentName,
    hasResponded: true,
    responder: res.responder_name ?? awaitingText,
    reason: res.reason ?? "—",
    formattedDate: formatCircularDate(res.submitted_at, locale),
    variant: resolveResponseBadgeVariant(res.status),
    label: rawLabel ?? res.status,
  };
}
