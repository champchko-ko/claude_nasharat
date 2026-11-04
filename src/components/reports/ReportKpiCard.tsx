import type { LucideIcon } from "lucide-react";
import {
  CARD_DIAMOND_ICON,
  CARD_DIAMOND_SM,
  CARD_RULE,
  CARD_SHELL,
} from "@/components/ui/diamond-card-styles";

export function ReportKpiCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: "good" | "warning" | "neutral";
}) {
  const trendColor =
    trend === "good"
      ? "text-success"
      : trend === "warning"
        ? "text-warning"
        : "text-muted-foreground";

  return (
    <div className={`${CARD_SHELL} h-full px-5 pt-12 pb-6`}>
      {Icon && (
        <div className={CARD_DIAMOND_SM}>
          <Icon className={`size-6 ${CARD_DIAMOND_ICON}`} />
        </div>
      )}
      <div className="text-3xl font-extrabold tracking-tight text-foreground">{value}</div>
      <div className="mt-1 text-sm font-bold text-foreground">{title}</div>
      <div className={`mt-3 ${CARD_RULE} mb-3`} />
      <div className={`min-h-4 text-xs font-medium ${trendColor}`}>{description ?? "\u00a0"}</div>
    </div>
  );
}
