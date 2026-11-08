"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n";
import { toast } from "sonner";
import { SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateSchoolAction } from "@/actions/settings/updateSchoolAction";
import type { SchoolFullDetails } from "@/lib/school/getSchoolFullDetails";
import { SchoolProfileSubTabs } from "./SchoolProfileSubTabs";
import { SchoolProfilePanels } from "./SchoolProfilePanels";
import type { SchoolProfileTabId } from "./schoolProfileTabTypes";

export function SchoolProfileForm({
  school,
  canManage,
}: {
  school: SchoolFullDetails;
  canManage: boolean;
}) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SchoolProfileTabId>("identity");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const res = await updateSchoolAction(formData);
      if (res.success) {
        toast.success(tCommon("saved"));
        router.refresh();
      } else {
        toast.error(res.error ?? tCommon("error"));
      }
    });
  };

  const formKey = `${school.id}-${school.updated_at ?? ""}-${school.name_ar}-${school.name_en}`;

  return (
    <form key={formKey} action={handleSubmit} className="flex flex-col gap-6">
      <SchoolProfileSubTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <SchoolProfilePanels activeTab={activeTab} school={school} canManage={canManage} />

        {canManage && (
          <div className="mt-8 flex justify-end border-t border-border/70 pt-4">
            <Button type="submit" disabled={isPending} className="gap-2">
              <SaveIcon className="size-4" />
              <span>{isPending ? tCommon("saving") : t("saveSchool")}</span>
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}
