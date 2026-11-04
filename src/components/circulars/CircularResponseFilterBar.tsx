import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export type ResponseFilterTab = "all" | "responded" | "acknowledged" | "rejected" | "pending";

export function CircularResponseFilterBar({
  filter,
  setFilter,
  totalCount,
  respondedCount,
  acknowledgedCount,
  rejectedCount,
  pendingCount,
}: {
  filter: ResponseFilterTab;
  setFilter: (f: ResponseFilterTab) => void;
  totalCount: number;
  respondedCount: number;
  acknowledgedCount: number;
  rejectedCount: number;
  pendingCount: number;
}) {
  const t = useTranslations("circulars");

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs"
          onClick={() => setFilter("all")}
        >
          {t("allFilter")} ({totalCount})
        </Button>
        <Button
          variant={filter === "responded" ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs text-success"
          onClick={() => setFilter("responded")}
        >
          {t("respondedFilter")} ({respondedCount})
        </Button>
        <Button
          variant={filter === "acknowledged" ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs text-primary"
          onClick={() => setFilter("acknowledged")}
        >
          {t("acknowledgedFilter")} ({acknowledgedCount})
        </Button>
        {rejectedCount > 0 ? (
          <Button
            variant={filter === "rejected" ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs text-destructive"
            onClick={() => setFilter("rejected")}
          >
            {t("rejectedFilter")} ({rejectedCount})
          </Button>
        ) : null}
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs text-muted-foreground"
          onClick={() => setFilter("pending")}
        >
          {t("notRespondedFilter")} ({pendingCount})
        </Button>
      </div>
      <span className="text-xs text-muted-foreground">
        {t("respondedProgress", { responded: respondedCount, total: totalCount })}
      </span>
    </div>
  );
}
