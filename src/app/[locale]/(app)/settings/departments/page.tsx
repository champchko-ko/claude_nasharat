import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { isCurrentUserPlatformOwner } from "@/lib/auth/isCurrentUserPlatformOwner";
import { getSchoolDepartments } from "@/lib/school/getSchoolDepartments";
import { hasPermission } from "@/lib/rbac/hasPermission";
import { DepartmentList } from "@/components/settings/DepartmentList";
import { CreateDepartmentForm } from "@/components/settings/CreateDepartmentForm";

export default async function DepartmentsSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("settings");

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

  const departments = await getSchoolDepartments("singleton");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{t("departments")}</h2>
        <p className="text-sm text-muted-foreground">{t("departmentsDesc")}</p>
      </div>

      <CreateDepartmentForm />
      <DepartmentList departments={departments} canManage={canManage} />
    </div>
  );
}
