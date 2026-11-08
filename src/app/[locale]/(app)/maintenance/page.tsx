import { setRequestLocale } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { isCurrentUserPlatformOwner } from "@/lib/auth/isCurrentUserPlatformOwner";
import { getSchoolMaintenanceRequests } from "@/lib/maintenance/getSchoolMaintenanceRequests";
import { hasPermission } from "@/lib/rbac/hasPermission";
import { MaintenanceList } from "@/components/maintenance/MaintenanceList";

export default async function MaintenancePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const profile = await getCurrentProfile();
  const [tickets, isOwner, hasPerm] = await Promise.all([
    getSchoolMaintenanceRequests("singleton"),
    isCurrentUserPlatformOwner(profile?.id),
    profile
      ? hasPermission("maintenance.create", undefined, profile.department_id).catch(() => false)
      : false,
  ]);
  const canCreate = isOwner || hasPerm;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <MaintenanceList tickets={tickets} canCreate={canCreate} />
    </div>
  );
}
