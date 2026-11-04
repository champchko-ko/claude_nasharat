"use client";

import { useTransition, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDepartmentAction } from "@/actions/settings/createDepartmentAction";

export function CreateDepartmentForm() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const res = await createDepartmentAction(formData);
      if (res.success) {
        toast.success(tCommon("saved"));
        formRef.current?.reset();
        router.refresh();
      } else {
        toast.error(res.error ?? tCommon("error"));
      }
    });
  };

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-end"
    >
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="name_ar">{t("deptNameAr")}</Label>
        <Input id="name_ar" name="name_ar" required placeholder="مثال: قسم شؤون الطلاب" />
      </div>
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="name_en">{t("deptNameEn")}</Label>
        <Input id="name_en" name="name_en" required placeholder="e.g. Student Affairs" />
      </div>
      <Button type="submit" disabled={isPending} className="shrink-0 gap-1.5">
        <PlusIcon className="size-4" />
        <span>{tCommon("create")}</span>
      </Button>
    </form>
  );
}
