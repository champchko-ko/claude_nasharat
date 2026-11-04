"use client";

import { useTranslations } from "next-intl";
import { FileTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CalendarCategory } from "@/lib/calendar/types";

const CATEGORIES = ["all", "academic", "exam", "holiday", "meeting", "event", "circular"] as const;

export function CalendarCategoryFilterBar({
  selectedCategory,
  onSelectCategory,
}: {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}) {
  const t = useTranslations("calendar");
  const tCirc = useTranslations("circulars");

  return (
    <div className="flex flex-wrap gap-1.5">
      {CATEGORIES.map((cat) => (
        <Button
          key={cat}
          variant={selectedCategory === cat ? "default" : "outline"}
          size="sm"
          onClick={() => onSelectCategory(cat)}
          className="gap-1.5"
        >
          {cat === "circular" && <FileTextIcon className="size-3.5 text-chart-4" />}
          {cat === "all"
            ? t("title")
            : cat === "circular"
              ? tCirc("title")
              : t(`categories.${cat as CalendarCategory}`)}
        </Button>
      ))}
    </div>
  );
}
