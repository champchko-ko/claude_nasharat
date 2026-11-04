import { CheckCircle2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CircularResponseRow } from "@/lib/circulars/types";

export function CircularResponseBanner({
  response,
  statusLabel,
}: {
  response: CircularResponseRow;
  statusLabel: string;
}) {
  const t = useTranslations("circulars");

  const statusLabels: Record<string, string> = {
    pending: t("pending"),
    acknowledged: t("acknowledged"),
    approved: t("approved"),
    rejected: t("rejected"),
    completed: t("completed"),
    not_applicable: t("notApplicable"),
  };

  const translatedStatus = statusLabels[response.status] ?? response.status;

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-[color:var(--panel,var(--muted))] p-4 text-sm">
      <CheckCircle2Icon className="size-5 shrink-0 text-primary" />
      <div>
        <p className="font-medium text-foreground">
          {statusLabel}: {translatedStatus}
        </p>
        {response.reason ? (
          <p className="mt-1 text-xs text-muted-foreground">{response.reason}</p>
        ) : null}
      </div>
    </div>
  );
}
