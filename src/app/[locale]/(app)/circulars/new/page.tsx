import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { getSchoolDepartments } from "@/lib/school/getSchoolDepartments";
import { hasPermission } from "@/lib/rbac/hasPermission";
import { CreateCircularForm } from "@/components/circulars";

export default async function NewCircularPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("circulars");

  const profile = await getCurrentProfile();
  const canCreate = profile?.school_id
    ? await hasPermission("circular.create", profile.school_id).catch(() => false)
    : false;

  if (!canCreate) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center text-sm text-destructive">
        Unauthorized
      </div>
    );
  }

  const departments = await getSchoolDepartments(profile?.school_id);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        title={t("newCircular")}
        subtitle={t("subtitle")}
        backHref="/circulars"
        backLabel={t("backToList")}
      />

      <CreateCircularForm departments={departments} />
    </div>
  );
}
