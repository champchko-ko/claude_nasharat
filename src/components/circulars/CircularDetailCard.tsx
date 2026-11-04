import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GoldDots } from "@/components/ui/gold-dots";
import { CircularPriorityBadge } from "./CircularPriorityBadge";
import { CircularVisibilityBadge } from "./CircularVisibilityBadge";
import { CircularStatusBadge } from "./CircularStatusBadge";
import { CircularDetailActions } from "./CircularDetailActions";
import { CircularAttachmentsList } from "./CircularAttachmentsList";
import { CircularDetailMetaGrid } from "./CircularDetailMetaGrid";
import { CircularDetailTargets } from "./CircularDetailTargets";
import type { CircularDetail } from "@/lib/circulars/getCircularById";

export function CircularDetailCard({
  circular,
  canPublish,
  canManage = false,
  totalDepartments,
}: {
  circular: CircularDetail;
  canPublish: boolean;
  canManage?: boolean;
  totalDepartments?: number;
}) {
  const t = useTranslations("circulars");

  return (
    <Card className="border border-border bg-card">
      <div
        aria-hidden="true"
        className="-mt-(--card-spacing) h-1.5 bg-[linear-gradient(90deg,var(--action-from,#0b63d6),var(--action-to,#0a2f7a))]"
      />
      <CardHeader className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-muted-foreground">
              {circular.ref_number}
            </span>
            <CircularVisibilityBadge visibility={circular.visibility} />
            <CircularPriorityBadge priority={circular.priority} />
            <CircularStatusBadge status={circular.status} />
          </div>
          <CardTitle className="font-heading text-xl font-extrabold text-primary">
            {circular.title}
          </CardTitle>
          <div className="h-0.5 w-24 rounded-full bg-[linear-gradient(90deg,var(--rule-from,#b88a2a),var(--action-to,#0a2f7a))]" />
        </div>
        <CircularDetailActions circular={circular} canPublish={canPublish} canManage={canManage} />
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <CircularDetailMetaGrid
          publishedAt={circular.publish_at}
          dueAt={circular.due_at}
          responseType={circular.response_type}
        />

        <CircularDetailTargets circular={circular} totalDepartments={totalDepartments} />

        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-xs font-extrabold text-primary">
            {t("circularBody")}
            <GoldDots />
          </h3>
          <div className="rounded-lg border-y border-s-4 border-e border-border border-s-gold bg-background p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {circular.body}
          </div>
        </div>

        {circular.attachments && circular.attachments.length > 0 ? (
          <CircularAttachmentsList
            attachments={circular.attachments}
            circularId={circular.id}
            canManage={canManage}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
