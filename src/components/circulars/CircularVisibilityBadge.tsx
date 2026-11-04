import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { CircularVisibility } from "@/lib/circulars/types";

export function CircularVisibilityBadge({ visibility }: { visibility?: CircularVisibility }) {
  const t = useTranslations("circulars");
  const isPublic = visibility === "public";

  return (
    <Badge
      variant={isPublic ? "default" : "secondary"}
      className={
        isPublic
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-border bg-muted/60 text-muted-foreground"
      }
    >
      {isPublic ? t("visibilityBadgePublic") : t("visibilityBadgeInternal")}
    </Badge>
  );
}
