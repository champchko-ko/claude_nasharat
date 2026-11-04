import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { getEffectivePermissions } from "@/lib/rbac/getEffectivePermissions";
import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";
import { getSchoolCirculars } from "@/lib/circulars/getSchoolCirculars";
import { getSchoolMaintenanceRequests } from "@/lib/maintenance/getSchoolMaintenanceRequests";
import { getSchoolCalendarEvents } from "@/lib/calendar/getSchoolCalendarEvents";
import { getSchoolAchievements } from "@/lib/achievements/getSchoolAchievements";
import {
  DashboardStatsGrid,
  DashboardRecentCirculars,
  DashboardRecentMaintenance,
  DashboardAchievementsWidget,
  DashboardComplianceWidget,
} from "@/components/dashboard";
import { loadDashboardCompliance } from "@/lib/dashboard/loadDashboardCompliance";
import { resolveDashboardPermissions } from "@/lib/dashboard/resolveDashboardPermissions";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (!user) {
    redirect({ href: "/login", locale });
    return null;
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect({ href: "/login", locale });
    return null;
  }

  const schoolId = profile.school_id;
  const [perms, circulars, maintenance, events, isOwner] = await Promise.all([
    getEffectivePermissions(schoolId).catch((): string[] => []),
    getSchoolCirculars(schoolId),
    getSchoolMaintenanceRequests(schoolId),
    getSchoolCalendarEvents(schoolId),
    isPlatformOwner(profile.id),
  ]);

  const achievements = isOwner ? await getSchoolAchievements(schoolId) : [];
  const { canViewCompliance } = resolveDashboardPermissions(isOwner, perms);

  const complianceData = canViewCompliance && schoolId ? await loadDashboardCompliance() : null;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <DashboardStatsGrid
        circularsCount={circulars.length}
        maintenanceCount={maintenance.length}
        eventsCount={events.length}
        achievementsCount={achievements.length}
        isOwner={isOwner}
      />

      {complianceData && <DashboardComplianceWidget data={complianceData} />}

      {isOwner ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <DashboardRecentCirculars circulars={circulars} />
            <DashboardRecentMaintenance requests={maintenance} />
          </div>
          <div className="space-y-6">
            <DashboardAchievementsWidget achievements={achievements} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DashboardRecentCirculars circulars={circulars} />
          <DashboardRecentMaintenance requests={maintenance} />
        </div>
      )}
    </div>
  );
}
