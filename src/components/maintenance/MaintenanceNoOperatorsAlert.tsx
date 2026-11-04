import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { AlertCircleIcon, ArrowRightIcon } from "lucide-react";

export function MaintenanceNoOperatorsAlert() {
  const t = useTranslations("maintenance.actions");
  const locale = useLocale();

  return (
    <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-warning">
      <AlertCircleIcon className="mt-0.5 size-5 shrink-0" />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{t("noOperatorsWarningTitle")}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("noOperatorsWarningDesc")}
        </p>
        <div className="pt-1">
          <Link
            href={`/${locale}/settings/users`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary underline underline-offset-4 hover:opacity-80"
          >
            <span>{t("createOperatorLink")}</span>
            <ArrowRightIcon className="size-3.5 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}
