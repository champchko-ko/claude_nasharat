import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
  TrophyIcon,
  BookOpenIcon,
  FlaskConicalIcon,
  MedalIcon,
  HeartHandshakeIcon,
  SparklesIcon,
} from "lucide-react";
import type { AchievementCategory } from "@/lib/achievements/types";

export function AchievementCategoryBadge({ category }: { category: AchievementCategory }) {
  const t = useTranslations("achievements.categories");

  if (category === "academic") {
    return (
      <Badge variant="outline" className="gap-1 border-info/30 bg-info/10 text-info">
        <BookOpenIcon className="size-3" />
        <span>{t("academic")}</span>
      </Badge>
    );
  }

  if (category === "competition") {
    return (
      <Badge variant="outline" className="gap-1 border-warning/30 bg-warning/10 text-warning">
        <TrophyIcon className="size-3" />
        <span>{t("competition")}</span>
      </Badge>
    );
  }

  if (category === "scientific") {
    return (
      <Badge variant="outline" className="gap-1 border-success/30 bg-success/10 text-success">
        <FlaskConicalIcon className="size-3" />
        <span>{t("scientific")}</span>
      </Badge>
    );
  }

  if (category === "sports") {
    return (
      <Badge variant="outline" className="gap-1 border-chart-4/30 bg-chart-4/10 text-chart-4">
        <MedalIcon className="size-3" />
        <span>{t("sports")}</span>
      </Badge>
    );
  }

  if (category === "community") {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-destructive/30 bg-destructive/10 text-destructive"
      >
        <HeartHandshakeIcon className="size-3" />
        <span>{t("community")}</span>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 border-chart-3/30 bg-chart-3/10 text-chart-3">
      <SparklesIcon className="size-3" />
      <span>{t("other")}</span>
    </Badge>
  );
}
