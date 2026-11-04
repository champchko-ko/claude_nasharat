"use client";

import { useTransition, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createLocationAction } from "@/actions/settings/createLocationAction";

export function CreateLocationForm() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const res = await createLocationAction(formData);
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
      className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
    >
      <div className="space-y-1.5">
        <Label htmlFor="building">{t("building")}</Label>
        <Input id="building" name="building" required placeholder="مثال: المبنى الرئيسي" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="floor">{t("floor")}</Label>
        <Input id="floor" name="floor" placeholder="مثال: الطابق الأول" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="room">{t("room")}</Label>
        <Input id="room" name="room" placeholder="مثال: قاعة 101" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="kind">{t("kind")}</Label>
        <Input id="kind" name="kind" defaultValue="room" placeholder="room / lab / hall" />
      </div>
      <Button type="submit" disabled={isPending} className="gap-1.5">
        <PlusIcon className="size-4" />
        <span>{tCommon("create")}</span>
      </Button>
    </form>
  );
}
