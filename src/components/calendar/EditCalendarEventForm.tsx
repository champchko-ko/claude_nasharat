"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeftIcon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PANEL } from "@/components/ui/diamond-card-styles";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalendarCoreFields } from "./CalendarCoreFields";
import { CalendarDateTimeFields } from "./CalendarDateTimeFields";
import { formatDateTimeInput } from "@/lib/calendar/formatDateTimeInput";
import { isWeekendDay } from "@/lib/calendar/isWeekendDay";
import { updateCalendarEventAction } from "@/actions/calendar/updateCalendarEventAction";
import { calendarImageRules } from "@/lib/calendar/calendarImageRules";
import { validateClientFile } from "@/lib/storage/validateClientFile";
import type { CalendarEventRow } from "@/lib/calendar/types";

type EditCalendarEventFormProps = {
  event: CalendarEventRow;
  workingDays?: number[] | null;
};

export function EditCalendarEventForm({ event, workingDays }: EditCalendarEventFormProps) {
  const t = useTranslations("calendar");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    const startsAt = String(formData.get("starts_at") || "");
    const endsAt = String(formData.get("ends_at") || "");
    if (isWeekendDay(startsAt, workingDays) || isWeekendDay(endsAt, workingDays)) {
      toast.error(t("weekendNotAllowed"));
      return;
    }

    const imageFile = formData.get("image") as File | null;
    if (imageFile && imageFile.size > 0) {
      const validation = validateClientFile(imageFile, {
        allowedMimes: calendarImageRules.allowedMime,
        maxBytes: calendarImageRules.maxBytes,
      });
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }
    }

    startTransition(async () => {
      const res = await updateCalendarEventAction(formData);
      if (res.success) {
        toast.success(tCommon("saved"));
        router.push(`/${locale}/calendar/${event.id}`);
      } else {
        toast.error(res.error || tCommon("error"));
      }
    });
  };

  return (
    <form action={handleSubmit} className="max-w-2xl space-y-6">
      <input type="hidden" name="event_id" value={event.id} />

      <Link href={`/${locale}/calendar/${event.id}`}>
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeftIcon className="size-4 rtl:rotate-180" />
          <span>{t("backToList")}</span>
        </Button>
      </Link>

      <div className={`${PANEL} space-y-4 p-6 sm:p-8`}>
        <CalendarCoreFields
          defaultCategory={event.category}
          defaultTitleAr={event.title_ar}
          defaultTitleEn={event.title_en}
          defaultDescription={event.description}
          defaultLocation={event.location}
        />
        <CalendarDateTimeFields
          defaultStartsAt={formatDateTimeInput(event.starts_at)}
          defaultEndsAt={formatDateTimeInput(event.ends_at)}
          defaultAllDay={event.all_day}
          defaultVisibility={event.visibility}
          workingDays={workingDays}
        />

        <div className="space-y-2 border-t border-border pt-4">
          <Label htmlFor="image" className="flex items-center gap-2">
            <UploadIcon className="size-4 text-muted-foreground" />
            <span>{t("bannerImage")}</span>
          </Label>
          <Input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" />
          <p className="text-xs text-muted-foreground">{t("bannerHelp")}</p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Link href={`/${locale}/calendar/${event.id}`}>
          <Button variant="outline">{tCommon("cancel")}</Button>
        </Link>
        <Button type="submit" disabled={isPending}>
          {isPending ? tCommon("loading") : tCommon("save")}
        </Button>
      </div>
    </form>
  );
}
