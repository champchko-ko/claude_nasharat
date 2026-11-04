import { useTranslations } from "next-intl";
import { InfoIcon } from "lucide-react";

export function CalendarWeekendNotice() {
  const t = useTranslations("calendar");

  return (
    <div className="flex items-center gap-2 rounded-md border border-warning/20 bg-warning/5 px-3 py-2 text-xs text-warning">
      <InfoIcon className="size-4 shrink-0" />
      <span>{t("weekendNotice")}</span>
    </div>
  );
}
