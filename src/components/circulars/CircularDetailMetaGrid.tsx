import { useLocale, useTranslations } from "next-intl";
import { formatCircularDate } from "@/lib/circulars/formatCircularDate";

export function CircularDetailMetaGrid({
  publishedAt,
  dueAt,
  responseType,
}: {
  publishedAt?: string | null;
  dueAt?: string | null;
  responseType: string;
}) {
  const t = useTranslations("circulars");
  const locale = useLocale();

  const formattedDueDate = formatCircularDate(dueAt, locale);
  const formattedPublishDate = formatCircularDate(publishedAt, locale);

  const responseTypeLabels: Record<string, string> = {
    acknowledgement: t("responseTypeAck"),
    approval: t("responseTypeApproval"),
    task: t("responseTypeTask"),
  };

  const responseTypeLabel = responseTypeLabels[responseType] ?? responseType;

  return (
    <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-[color:var(--panel,var(--muted))] p-4 text-xs sm:grid-cols-3">
      <div>
        <span className="text-muted-foreground">{t("publishedAt")}: </span>
        <span suppressHydrationWarning className="font-medium text-foreground">
          {formattedPublishDate}
        </span>
      </div>
      <div>
        <span className="text-muted-foreground">{t("dueDate")}: </span>
        <span suppressHydrationWarning className="font-medium text-foreground">
          {formattedDueDate}
        </span>
      </div>
      <div>
        <span className="text-muted-foreground">{t("responseType")}: </span>
        <span className="font-medium text-foreground">{responseTypeLabel}</span>
      </div>
    </div>
  );
}
