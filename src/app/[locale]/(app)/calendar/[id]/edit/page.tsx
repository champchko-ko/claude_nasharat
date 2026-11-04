import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";
import { hasPermission } from "@/lib/rbac/hasPermission";
import { getSchoolFullDetails } from "@/lib/school/getSchoolFullDetails";
import { getCalendarEventById } from "@/lib/calendar/getCalendarEventById";
import { EditCalendarEventForm } from "@/components/calendar/EditCalendarEventForm";

export default async function EditCalendarEventPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("calendar");

  const profile = await getCurrentProfile();
  if (!profile?.school_id) {
    redirect(`/${locale}/login`);
  }

  const event = await getCalendarEventById(id);
  if (!event || event.school_id !== profile.school_id) {
    notFound();
  }

  const [hasManagePerm, isOwner, schoolDetails] = await Promise.all([
    hasPermission("calendar.manage", profile.school_id).catch(() => false),
    isPlatformOwner(profile.id),
    getSchoolFullDetails(profile.school_id).catch(() => null),
  ]);

  const canManage = isOwner || hasManagePerm;
  if (!canManage) {
    redirect(`/${locale}/calendar/${id}`);
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href={`/calendar/${event.id}`}>
          <Button variant="ghost" size="icon" aria-label={t("backToList")}>
            <ArrowLeftIcon className="size-4 rtl:rotate-180" />
          </Button>
        </Link>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight text-foreground">{t("actions.edit")}</h1>
          <span className="text-xs text-muted-foreground">{event.title_ar}</span>
        </div>
      </div>

      <EditCalendarEventForm event={event} workingDays={schoolDetails?.working_days} />
    </div>
  );
}
