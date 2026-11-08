import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { isCurrentUserPlatformOwner } from "@/lib/auth/isCurrentUserPlatformOwner";
import { getSchoolFullDetails } from "@/lib/school/getSchoolFullDetails";
import { hasPermission } from "@/lib/rbac/hasPermission";
import { SchoolProfileForm } from "@/components/settings/SchoolProfileForm";

export default async function SchoolSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("settings");
  const tCommon = await getTranslations("common");

  const profile = await getCurrentProfile();
  const [hasPerm, isOwner] = await Promise.all([
    profile
      ? hasPermission("settings.school.update").catch(() => false)
      : false,
    isCurrentUserPlatformOwner(profile?.id),
  ]);

  const canManage = isOwner || hasPerm;

  if (!canManage) {
    redirect({ href: "/settings", locale });
  }

  const school = await getSchoolFullDetails();

  if (!school) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
        {tCommon("noData")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{t("school")}</h2>
        <p className="text-sm text-muted-foreground">{t("schoolDesc")}</p>
      </div>

      <SchoolProfileForm school={school} canManage={canManage} />
    </div>
  );
}
