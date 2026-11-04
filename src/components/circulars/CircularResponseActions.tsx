import { useTranslations } from "next-intl";
import { CheckCircle2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CircularResponseStatus, CircularResponseType } from "@/lib/circulars/types";
import { CircularApprovalResponse } from "./CircularApprovalResponse";

export function CircularResponseActions({
  responseType,
  reason,
  onReasonChange,
  onResponse,
  isPending,
  isAcknowledged,
}: {
  responseType: CircularResponseType;
  reason: string;
  onReasonChange: (val: string) => void;
  onResponse: (status: CircularResponseStatus) => void;
  isPending: boolean;
  isAcknowledged: boolean;
}) {
  const t = useTranslations("circulars");

  if (responseType === "acknowledgement") {
    return (
      <Button
        onClick={() => onResponse("acknowledged")}
        disabled={isPending || isAcknowledged}
        className="w-full gap-2 sm:w-auto"
      >
        <CheckCircle2Icon className="size-4" />
        <span>{t("ackAction")}</span>
      </Button>
    );
  }

  if (responseType === "approval") {
    return (
      <CircularApprovalResponse
        reason={reason}
        onReasonChange={onReasonChange}
        onAcknowledge={() => onResponse("acknowledged")}
        onApprove={() => onResponse("approved")}
        onReject={() => onResponse("rejected")}
        isPending={isPending}
        isAcknowledged={isAcknowledged}
      />
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {!isAcknowledged ? (
        <Button
          variant="outline"
          onClick={() => onResponse("acknowledged")}
          disabled={isPending}
          className="w-full gap-2 sm:w-auto"
        >
          <CheckCircle2Icon className="size-4" />
          <span>{t("ackAction")}</span>
        </Button>
      ) : null}
      <Button
        onClick={() => onResponse("completed")}
        disabled={isPending}
        className="w-full gap-2 sm:w-auto"
      >
        <CheckCircle2Icon className="size-4" />
        <span>{t("statusCompleted")}</span>
      </Button>
    </div>
  );
}
