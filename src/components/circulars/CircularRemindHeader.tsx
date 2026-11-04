"use client";

import { useTranslations } from "next-intl";
import { BellRingIcon } from "lucide-react";

export function CircularRemindHeader({ circularTitle }: { circularTitle?: string }) {
  const t = useTranslations("circulars");

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-primary">
        <BellRingIcon className="size-5" />
        <h3 className="font-heading text-lg font-bold text-foreground">{t("remindModalTitle")}</h3>
      </div>
      {circularTitle && (
        <p className="truncate text-xs font-semibold text-muted-foreground">{circularTitle}</p>
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">{t("remindModalDesc")}</p>
    </div>
  );
}
