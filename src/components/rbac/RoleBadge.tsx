"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

export function RoleBadge({ isSystem }: { isSystem: boolean }) {
  const t = useTranslations("rbac");

  if (isSystem) {
    return (
      <Badge variant="secondary" className="text-xs">
        {t("systemRole")}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-primary/50 text-xs text-primary">
      {t("customRole")}
    </Badge>
  );
}
