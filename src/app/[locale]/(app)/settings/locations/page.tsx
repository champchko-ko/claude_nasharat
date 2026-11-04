import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { isCurrentUserPlatformOwner } from "@/lib/auth/isCurrentUserPlatformOwner";
import { getSchoolLocations } from "@/lib/school/getSchoolLocations";
import { hasPermission } from "@/lib/rbac/hasPermission";
import { LocationList } from "@/components/settings/LocationList";
import { CreateLocationForm } from "@/components/settings/CreateLocationForm";

export default async function LocationsSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("settings");

  const profile = await getCurrentProfile();
  const [hasPerm, isOwner] = await Promise.all([
    profile?.school_id
      ? hasPermission("settings.school.update", profile.school_id).catch(() => false)
      : false,
    isCurrentUserPlatformOwner(profile?.id),
  ]);

  const canManage = isOwner || hasPerm;

  if (!canManage) {
    redirect({ href: "/settings", locale });
  }

  const locations = await getSchoolLocations(profile?.school_id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{t("locations")}</h2>
        <p className="text-sm text-muted-foreground">{t("locationsDesc")}</p>
      </div>

      <CreateLocationForm />
      <LocationList locations={locations} canManage={canManage} />
    </div>
  );
}
