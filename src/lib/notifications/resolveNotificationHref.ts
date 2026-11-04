import type { NotificationRow } from "@/lib/notifications/types";

export function resolveNotificationHref(row: NotificationRow): string | null {
  if (!row.entity_id) return null;
  if (row.entity_type === "circular") return `/circulars/${row.entity_id}`;
  if (row.entity_type === "maintenance_request") return `/maintenance/${row.entity_id}`;
  if (row.entity_type === "calendar_event") return `/calendar/${row.entity_id}`;
  return null;
}
