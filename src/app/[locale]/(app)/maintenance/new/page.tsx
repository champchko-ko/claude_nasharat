import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { getSchoolLocations } from "@/lib/school/getSchoolLocations";
import { hasPermission } from "@/lib/rbac/hasPermission";
import { CreateMaintenanceForm } from "@/components/maintenance/CreateMaintenanceForm";

export default async function NewMaintenancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const profile = await getCurrentProfile();
  if (!profile?.school_id) {
    redirect(`/${locale}/login`);
  }

  const canCreate = await hasPermission(
    "maintenance.create",
    profile.school_id,
    profile.department_id,
  ).catch(() => false);
  if (!canCreate) {
    redirect(`/${locale}/maintenance`);
  }

  const allLocations = await getSchoolLocations(profile.school_id);
  const activeLocations = allLocations.filter((l) => l.is_active);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <CreateMaintenanceForm locations={activeLocations} />
    </div>
  );
}
