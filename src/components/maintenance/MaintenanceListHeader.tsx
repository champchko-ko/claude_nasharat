"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export function MaintenanceListHeader({ canCreate }: { canCreate: boolean }) {
  const t = useTranslations("maintenance");
  const locale = useLocale();

  return (
    <PageHeader
      title={t("title")}
      subtitle={t("description")}
      action={
        canCreate ? (
          <Link href={`/${locale}/maintenance/new`}>
            <Button className="gap-2">
              <PlusIcon className="size-4" />
              <span>{t("submitTicket")}</span>
            </Button>
          </Link>
        ) : null
      }
    />
  );
}
