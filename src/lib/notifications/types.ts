export type NotificationType = "circular" | "maintenance" | "calendar" | "system";

export type NotificationEntityKind = "circular" | "maintenance_request" | "calendar_event";

export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  entity_type: NotificationEntityKind | null;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
}

export interface CreateNotificationInput {
  userId: string;
  schoolId?: string | null;
  type: NotificationType;
  title: string;
  body?: string | null;
  entityType?: NotificationEntityKind | null;
  entityId?: string | null;
  skipThrottle?: boolean;
}
