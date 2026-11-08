import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { isCurrentUserPlatformOwner } from "@/lib/auth/isCurrentUserPlatformOwner";
import { getSchoolCirculars } from "@/lib/circulars/getSchoolCirculars";
import { hasPermission } from "@/lib/rbac/hasPermission";
import { getSchoolDepartments } from "@/lib/school/getSchoolDepartments";
import { CircularList } from "@/components/circulars";

export default async function CircularsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("circulars");

  const profile = await getCurrentProfile();
  const [circulars, departments, isOwner, hasPerm] = await Promise.all([
    getSchoolCirculars("singleton"),
    getSchoolDepartments("singleton"),
    isCurrentUserPlatformOwner(profile?.id),
    profile
      ? hasPermission("circular.create").catch(() => false)
      : false,
  ]);
  const canCreate = isOwner || hasPerm;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          canCreate ? (
            <Link href="/circulars/new">
              <Button className="gap-2">
                <PlusIcon className="size-4" />
                <span>{t("newCircular")}</span>
              </Button>
            </Link>
          ) : null
        }
      />

      <CircularList circulars={circulars} departments={departments} canManage={canCreate} />
    </div>
  );
}
