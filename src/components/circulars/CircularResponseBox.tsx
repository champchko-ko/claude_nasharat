"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GoldDots } from "@/components/ui/gold-dots";
import { submitCircularResponseAction } from "@/actions/circulars/submitCircularResponseAction";
import type {
  CircularResponseStatus,
  CircularResponseType,
  CircularResponseRow,
} from "@/lib/circulars/types";
import { CircularResponseBanner } from "./CircularResponseBanner";
import { CircularResponseActions } from "./CircularResponseActions";

export function CircularResponseBox({
  circularId,
  responseType,
  existingResponse,
}: {
  circularId: string;
  responseType: CircularResponseType;
  existingResponse?: CircularResponseRow | null;
}) {
  const t = useTranslations("circulars");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleResponse = (status: CircularResponseStatus) => {
    if (status === "rejected" && !reason.trim()) {
      toast.error(t("rejectionReason"));
      return;
    }

    startTransition(async () => {
      const res = await submitCircularResponseAction({
        circularId,
        responseType,
        status,
        reason,
      });

      if (res.success) {
        toast.success(t("responseRecorded"));
      } else {
        toast.error(res.error ?? "Failed to submit response");
      }
    });
  };

  const isAcknowledged = existingResponse?.status === "acknowledged";
  const hasFinalResponse = Boolean(existingResponse && existingResponse.status !== "acknowledged");

  return (
    <Card className="border border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5 font-heading text-base font-extrabold text-primary">
          <span>{t("respond")}</span>
          <GoldDots />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {existingResponse ? (
          <CircularResponseBanner response={existingResponse} statusLabel={t("responseStatus")} />
        ) : null}

        {!hasFinalResponse ? (
          <CircularResponseActions
            responseType={responseType}
            reason={reason}
            onReasonChange={setReason}
            onResponse={handleResponse}
            isPending={isPending}
            isAcknowledged={isAcknowledged}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
