import { setRequestLocale } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { isCurrentUserPlatformOwner } from "@/lib/auth/isCurrentUserPlatformOwner";
import { hasPermission } from "@/lib/rbac/hasPermission";
import { getSchoolCalendarEvents } from "@/lib/calendar/getSchoolCalendarEvents";
import { getSchoolCirculars } from "@/lib/circulars/getSchoolCirculars";
import { CalendarHub } from "@/components/calendar/CalendarHub";

export default async function CalendarPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const profile = await getCurrentProfile();
  const schoolId = profile ? "singleton" : null;

  const [hasManagePerm, events, circulars, isOwner] = await Promise.all([
    profile ? hasPermission("calendar.manage", undefined, profile.department_id).catch(() => false) : false,
    getSchoolCalendarEvents(schoolId),
    getSchoolCirculars(schoolId).catch(() => []),
    isCurrentUserPlatformOwner(profile?.id),
  ]);

  const canManageEvents = isOwner || hasManagePerm;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <CalendarHub events={events} circulars={circulars} canManageEvents={canManageEvents} />
    </div>
  );
}
