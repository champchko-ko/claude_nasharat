"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { PANEL } from "@/components/ui/diamond-card-styles";
import { MaintenanceCoreFields } from "./MaintenanceCoreFields";
import { createMaintenanceAction } from "@/actions/maintenance/createMaintenanceAction";
import type { LocationRow } from "@/lib/school/getSchoolLocations";

export function CreateMaintenanceForm({ locations }: { locations: LocationRow[] }) {
  const t = useTranslations("maintenance");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const res = await createMaintenanceAction(formData);
      if (res.success && res.requestId) {
        toast.success(tCommon("saved"));
        router.push(`/${locale}/maintenance/${res.requestId}`);
      } else {
        toast.error(res.error || tCommon("error"));
      }
    });
  };

  return (
    <form action={handleSubmit} className="max-w-2xl space-y-6">
      <PageHeader
        title={t("submitTicket")}
        subtitle={t("description")}
        backHref="/maintenance"
        backLabel={t("backToList")}
      />

      <div className={`${PANEL} space-y-4 p-6 sm:p-8`}>
        <div className="space-y-2">
          <Label htmlFor="title">{t("ticketTitle")} *</Label>
          <Input id="title" name="title" required placeholder={t("ticketTitle")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t("ticketDescription")} *</Label>
          <Textarea
            id="description"
            name="description"
            required
            rows={4}
            placeholder={t("ticketDescription")}
          />
        </div>

        <MaintenanceCoreFields locations={locations} />

        <div className="space-y-2 border-t border-border pt-4">
          <Label htmlFor="photo" className="flex items-center gap-2">
            <UploadIcon className="size-4 text-muted-foreground" />
            <span>{t("photo")}</span>
          </Label>
          <Input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
          <p className="text-xs text-muted-foreground">{t("photoHelp")}</p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Link href={`/${locale}/maintenance`}>
          <Button variant="outline">{tCommon("cancel")}</Button>
        </Link>
        <Button type="submit" disabled={isPending}>
          {isPending ? tCommon("loading") : t("submitTicket")}
        </Button>
      </div>
    </form>
  );
}
