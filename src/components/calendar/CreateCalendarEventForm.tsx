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
import { CalendarRecurrenceFields } from "./CalendarRecurrenceFields";
import { isWeekendDay } from "@/lib/calendar/isWeekendDay";
import { createCalendarEventAction } from "@/actions/calendar/createCalendarEventAction";
import { calendarImageRules } from "@/lib/calendar/calendarImageRules";
import { validateClientFile } from "@/lib/storage/validateClientFile";

export function CreateCalendarEventForm({
  workingDays,
}: {
  workingDays?: number[] | null;
} = {}) {
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
      const res = await createCalendarEventAction(formData);
      if (res.success) {
        toast.success(tCommon("saved"));
        router.push(`/${locale}/calendar`);
      } else {
        toast.error(res.error || tCommon("error"));
      }
    });
  };

  return (
    <form action={handleSubmit} className="max-w-2xl space-y-6">
      <Link href={`/${locale}/calendar`}>
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeftIcon className="size-4 rtl:rotate-180" />
          <span>{t("backToList")}</span>
        </Button>
      </Link>

      <div className={`${PANEL} space-y-4 p-6 sm:p-8`}>
        <CalendarCoreFields />
        <CalendarDateTimeFields workingDays={workingDays} />
        <CalendarRecurrenceFields />

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
        <Link href={`/${locale}/calendar`}>
          <Button variant="outline">{tCommon("cancel")}</Button>
        </Link>
        <Button type="submit" disabled={isPending}>
          {isPending ? tCommon("loading") : t("newEvent")}
        </Button>
      </div>
    </form>
  );
}
