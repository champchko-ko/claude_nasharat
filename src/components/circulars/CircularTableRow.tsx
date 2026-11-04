import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n";
import { TableCell, TableRow } from "@/components/ui/table";
import { PaperclipIcon } from "lucide-react";
import { CircularPriorityBadge } from "./CircularPriorityBadge";
import { CircularStatusBadge } from "./CircularStatusBadge";
import { CircularTargetBadges } from "./CircularTargetBadges";
import { CircularRowActions } from "./CircularRowActions";
import { formatCircularDate } from "@/lib/circulars/formatCircularDate";
import type { CircularRow } from "@/lib/circulars/types";

export function CircularTableRow({
  circular,
  canManage,
  totalDepartments,
}: {
  circular: CircularRow;
  canManage: boolean;
  totalDepartments?: number;
}) {
  const t = useTranslations("circulars");
  const locale = useLocale();
  const publishDateInput = circular.publish_at || circular.created_at;
  const formattedPublishDate = formatCircularDate(publishDateInput, locale);
  const formattedDueDate = formatCircularDate(circular.due_at, locale);
  const attachmentsCount = circular.attachments?.length ?? 0;

  return (
    <TableRow className="group transition-colors hover:bg-[color:var(--panel,var(--muted))] [&>td]:px-3 [&>td]:py-3">
      <TableCell className="font-mono text-xs font-semibold text-primary">
        <Link href={`/circulars/${circular.id}`} className="hover:underline">
          {circular.ref_number}
        </Link>
      </TableCell>
      <TableCell className="max-w-xs font-medium text-foreground">
        <div className="flex items-center gap-1.5 truncate">
          <Link
            href={`/circulars/${circular.id}`}
            className="truncate hover:text-primary hover:underline"
          >
            {circular.title}
          </Link>
          {attachmentsCount > 0 ? (
            <span
              className="inline-flex items-center gap-0.5 rounded-xs bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
              title={`${attachmentsCount} ${t("attachments")}`}
            >
              <PaperclipIcon className="size-3" />
              <span>{attachmentsCount}</span>
            </span>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <CircularPriorityBadge priority={circular.priority} />
      </TableCell>
      <TableCell>
        <CircularStatusBadge status={circular.status} />
      </TableCell>
      <TableCell>
        <CircularTargetBadges targets={circular.targets} totalDepartments={totalDepartments} />
      </TableCell>
      <TableCell
        suppressHydrationWarning
        className="font-mono text-xs whitespace-nowrap text-muted-foreground"
      >
        {formattedPublishDate}
      </TableCell>
      <TableCell
        suppressHydrationWarning
        className="font-mono text-xs whitespace-nowrap text-muted-foreground"
      >
        {formattedDueDate}
      </TableCell>
      <TableCell className="text-end">
        <CircularRowActions circularId={circular.id} canManage={canManage} />
      </TableCell>
    </TableRow>
  );
}
