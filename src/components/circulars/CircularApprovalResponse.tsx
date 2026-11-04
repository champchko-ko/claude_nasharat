import { useTranslations } from "next-intl";
import { CheckCircle2Icon, EyeIcon, XCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function CircularApprovalResponse({
  reason,
  onReasonChange,
  onAcknowledge,
  onApprove,
  onReject,
  isPending,
  isAcknowledged = false,
}: {
  reason: string;
  onReasonChange: (val: string) => void;
  onAcknowledge?: () => void;
  onApprove: () => void;
  onReject: () => void;
  isPending: boolean;
  isAcknowledged?: boolean;
}) {
  const t = useTranslations("circulars");

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="rejection_reason">{t("rejectionReason")}</Label>
        <Textarea
          id="rejection_reason"
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder={t("reasonPlaceholder")}
          rows={2}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {!isAcknowledged && onAcknowledge ? (
          <Button
            type="button"
            variant="outline"
            onClick={onAcknowledge}
            disabled={isPending}
            className="gap-2 border-primary/30 hover:border-primary"
          >
            <EyeIcon className="size-4 text-primary" />
            <span>{t("ackAction")}</span>
          </Button>
        ) : isAcknowledged ? (
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs font-semibold">
            <EyeIcon className="size-3.5 text-primary" />
            <span>{t("acknowledged")}</span>
          </Badge>
        ) : null}

        <Button type="button" onClick={onApprove} disabled={isPending} className="gap-2">
          <CheckCircle2Icon className="size-4" />
          <span>{t("respondedAction")}</span>
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onReject}
          disabled={isPending}
          className="gap-2"
        >
          <XCircleIcon className="size-4" />
          <span>{t("rejectAction")}</span>
        </Button>
      </div>
    </div>
  );
}
