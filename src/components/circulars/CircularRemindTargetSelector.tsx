"use client";

import { useTranslations } from "next-intl";
import { UsersIcon, UserXIcon } from "lucide-react";

export function CircularRemindTargetSelector({
  targetType,
  onChange,
}: {
  targetType: "pending" | "all";
  onChange: (type: "pending" | "all") => void;
}) {
  const t = useTranslations("circulars");

  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold text-foreground">{t("whoResponded")}</span>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange("pending")}
          className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-bold transition-all ${
            targetType === "pending"
              ? "border-destructive bg-destructive/10 text-destructive ring-2 ring-destructive/20 dark:text-destructive"
              : "border-border bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          <UserXIcon className="size-4" />
          <span>{t("targetPending")}</span>
        </button>

        <button
          type="button"
          onClick={() => onChange("all")}
          className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-bold transition-all ${
            targetType === "all"
              ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
              : "border-border bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          <UsersIcon className="size-4" />
          <span>{t("targetAll")}</span>
        </button>
      </div>
    </div>
  );
}
