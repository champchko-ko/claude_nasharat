"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AchievementFormFields } from "./AchievementFormFields";
import { createAchievementAction } from "@/actions/achievements/createAchievementAction";
import { calendarImageRules } from "@/lib/calendar/calendarImageRules";
import { validateClientFile } from "@/lib/storage/validateClientFile";
import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";

export function CreateAchievementForm({
  departments,
  onSuccess,
  onCancel,
}: {
  departments: DepartmentRow[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("achievements");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
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
      const res = await createAchievementAction(formData);
      if (res.success) {
        toast.success(tCommon("saved"));
        onSuccess();
      } else {
        toast.error(res.error ?? tCommon("error"));
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-5">
      <AchievementFormFields departments={departments} />
      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          {tCommon("cancel")}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}
