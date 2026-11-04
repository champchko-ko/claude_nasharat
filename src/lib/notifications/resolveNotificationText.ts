import { resolveReminderBody } from "./resolveReminderBody";

type NotificationLike = {
  title: string;
  body: string | null;
  type?: string;
};

type Translator = (key: string, values?: Record<string, string | number>) => string;

export function resolveNotificationText(
  notification: NotificationLike,
  t: Translator,
): { title: string; body: string | null } {
  const rawTitle = notification.title;

  if (rawTitle === "circular_published" || rawTitle === "تعميم إداري جديد") {
    return {
      title: t("templates.circular_published.title"),
      body: t("templates.circular_published.body"),
    };
  }

  if (rawTitle === "circular_reminder" || rawTitle === "تذكير عاجل: استجابة تعميم إداري") {
    return {
      title: t("templates.circular_reminder.title"),
      body: resolveReminderBody(notification.body, t),
    };
  }

  if (rawTitle === "maintenance_assigned" || rawTitle === "تم إسناد بلاغ صيانة جديد لك") {
    return {
      title: t("templates.maintenance_assigned.title"),
      body: t("templates.maintenance_assigned.body"),
    };
  }

  return {
    title: notification.title,
    body: notification.body,
  };
}
