"use client";

import { useTranslations } from "next-intl";
import { Trash2Icon, PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AchievementDetailMetaGrid } from "./AchievementDetailMetaGrid";
import type { SchoolAchievementRow } from "@/lib/achievements/types";

export function AchievementDetailView({
  achievement,
  canManage,
  isPending,
  onDelete,
  onEdit,
  onClose,
}: {
  achievement: SchoolAchievementRow;
  canManage: boolean;
  isPending: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("achievements");
  const tCommon = useTranslations("common");

  return (
    <>
      <AchievementDetailMetaGrid achievement={achievement} />

      {achievement.description && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            {t("description")}
          </h4>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {achievement.description}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                disabled={isPending}
                className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20"
              >
                <Trash2Icon className="size-4" />
                <span>{t("delete")}</span>
              </Button>
              <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5">
                <PencilIcon className="size-4" />
                <span>{tCommon("edit")}</span>
              </Button>
            </>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          {tCommon("close") ?? "Close"}
        </Button>
      </div>
    </>
  );
}
