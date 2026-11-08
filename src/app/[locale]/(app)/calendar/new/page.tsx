import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";
import { hasPermission } from "@/lib/rbac/hasPermission";
import { getSchoolFullDetails } from "@/lib/school/getSchoolFullDetails";
import { CreateCalendarEventForm } from "@/components/calendar/CreateCalendarEventForm";

export default async function NewCalendarEventPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(`/${locale}/login`);
  }

  const [hasManagePerm, isOwner, schoolDetails] = await Promise.all([
    hasPermission("calendar.manage", undefined, profile.department_id).catch(() => false),
    isPlatformOwner(profile.id),
    getSchoolFullDetails().catch(() => null),
  ]);

  const canManage = isOwner || hasManagePerm;

  if (!canManage) {
    redirect(`/${locale}/calendar`);
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <CreateCalendarEventForm workingDays={schoolDetails?.working_days} />
    </div>
  );
}
