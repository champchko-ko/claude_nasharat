"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AchievementCategoryBadge } from "./AchievementCategoryBadge";
import { AchievementDetailView } from "./AchievementDetailView";
import { EditAchievementForm } from "./EditAchievementForm";
import { deleteAchievementAction } from "@/actions/achievements/deleteAchievementAction";
import { showConfirmBox } from "@/lib/feedback/showConfirmBox";
import { useDrawerEscape } from "@/components/layout/useDrawerEscape";
import type { SchoolAchievementRow } from "@/lib/achievements/types";
import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";

export function AchievementDetailDialog({
  achievement,
  departments,
  canManage,
  onClose,
}: {
  achievement: SchoolAchievementRow | null;
  departments: DepartmentRow[];
  canManage: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("achievements");
  const tCommon = useTranslations("common");
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  useDrawerEscape(onClose, Boolean(achievement));

  if (!achievement) return null;

  const handleDelete = async () => {
    const confirmed = await showConfirmBox({
      message: `${t("delete")}?`,
      type: "warning",
    });
    if (!confirmed) return;
    startTransition(async () => {
      await deleteAchievementAction(achievement.id);
      onClose();
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="fixed inset-0 bg-scrim/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-xl space-y-5 overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <AchievementCategoryBadge category={achievement.category} />
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {achievement.visibility === "public" ? t("public") : t("internal")}
              </span>
            </div>
            <h2 className="text-xl font-bold text-foreground">{achievement.title_ar}</h2>
            {achievement.title_en && (
              <p className="mt-0.5 text-sm text-muted-foreground">{achievement.title_en}</p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={tCommon("close")}>
            <XIcon className="size-5" />
          </Button>
        </div>

        {isEditing ? (
          <EditAchievementForm
            achievement={achievement}
            departments={departments}
            onSuccess={() => {
              setIsEditing(false);
              onClose();
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <AchievementDetailView
            achievement={achievement}
            canManage={canManage}
            isPending={isPending}
            onDelete={handleDelete}
            onEdit={() => setIsEditing(true)}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
