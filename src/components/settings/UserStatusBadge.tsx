"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

export function UserStatusBadge({ isActive }: { isActive: boolean }) {
  const tCommon = useTranslations("common");

  return (
    <Badge variant={isActive ? "default" : "secondary"}>
      {isActive ? tCommon("active") : tCommon("inactive")}
    </Badge>
  );
}
