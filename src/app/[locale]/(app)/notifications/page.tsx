import { setRequestLocale } from "next-intl/server";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { redirect } from "@/i18n";
import { getUserNotifications } from "@/lib/notifications/getUserNotifications";
import { getUnreadNotificationCount } from "@/lib/notifications/getUnreadNotificationCount";
import { NotificationHeader, NotificationList } from "@/components/notifications";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (!user) {
    redirect({ href: "/login", locale });
  }

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(50),
    getUnreadNotificationCount(),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <NotificationHeader unreadCount={unreadCount} />
      <NotificationList notifications={notifications} />
    </div>
  );
}
