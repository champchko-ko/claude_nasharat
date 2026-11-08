import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoldDots } from "@/components/ui/gold-dots";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { isCurrentUserPlatformOwner } from "@/lib/auth/isCurrentUserPlatformOwner";
import { getCircularById } from "@/lib/circulars/getCircularById";
import { getCircularResponses } from "@/lib/circulars/getCircularResponses";
import { canRespondToCircular } from "@/lib/circulars/canRespondToCircular";
import { getEffectivePermissions } from "@/lib/rbac/getEffectivePermissions";
import { getSchoolDepartments } from "@/lib/school/getSchoolDepartments";
import { getCircularDepartmentStatuses, getCircularPermissions } from "@/lib/circulars";
import { shouldShowCircularReminder } from "@/lib/circulars/shouldShowCircularReminder";
import {
  CircularDetailCard,
  CircularResponseBox,
  CircularResponseTable,
  CircularRemindButton,
} from "@/components/circulars";

export default async function CircularDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("circulars");

  const profile = await getCurrentProfile();
  const [circular, responses, perms, departments, isOwner] = await Promise.all([
    getCircularById(id),
    getCircularResponses(id).catch(() => []),
    getEffectivePermissions().catch((): string[] => []),
    getSchoolDepartments("singleton").catch(() => []),
    isCurrentUserPlatformOwner(profile?.id),
  ]);

  if (!circular) {
    notFound();
  }

  const { canPublish, canManage, canViewResponses } = getCircularPermissions(perms, isOwner);
  const canRespond = canRespondToCircular(circular, profile);

  const userDeptResponse = responses.find((res) => res.department_id === profile?.department_id);
  const expectedDepartments = canViewResponses
    ? getCircularDepartmentStatuses(circular, departments, responses)
    : [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/circulars">
          <Button variant="ghost" size="icon" aria-label={t("backToList")}>
            <ArrowLeftIcon className="size-4 rtl:rotate-180" />
          </Button>
        </Link>
        <span className="text-sm font-medium text-muted-foreground">{t("backToList")}</span>
      </div>

      <CircularDetailCard
        circular={circular}
        canPublish={canPublish}
        canManage={canManage}
        totalDepartments={departments.length}
      />

      {canRespond ? (
        <CircularResponseBox
          circularId={circular.id}
          responseType={circular.response_type}
          existingResponse={userDeptResponse}
        />
      ) : null}

      {canViewResponses && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2.5 font-heading text-lg font-extrabold tracking-tight text-primary">
              <span>{t("responses")}</span>
              <GoldDots />
            </h3>
            {shouldShowCircularReminder(canManage, canPublish, circular.status) ? (
              <CircularRemindButton circularId={circular.id} circularTitle={circular.title} />
            ) : null}
          </div>
          <CircularResponseTable responses={responses} expectedDepartments={expectedDepartments} />
        </div>
      )}
    </div>
  );
}
