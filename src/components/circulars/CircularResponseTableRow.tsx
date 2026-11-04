import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { prepareResponseRowDisplay } from "@/lib/circulars/prepareResponseRowDisplay";
import type { DepartmentResponseStatus } from "@/lib/circulars/getCircularDepartmentStatuses";

export function CircularResponseTableRow({
  item,
  locale,
  statusLabels,
  awaitingText,
  notRespondedText,
}: {
  item: DepartmentResponseStatus;
  locale: string;
  statusLabels: Record<string, string>;
  awaitingText: string;
  notRespondedText: string;
}) {
  const row = prepareResponseRowDisplay(item, locale, statusLabels, awaitingText, notRespondedText);

  return (
    <TableRow>
      <TableCell className="font-medium text-foreground">{row.departmentName}</TableCell>
      <TableCell className="text-muted-foreground">
        {row.hasResponded ? (
          row.responder
        ) : (
          <span className="text-xs text-muted-foreground/70 italic">{row.responder}</span>
        )}
      </TableCell>
      <TableCell>
        <Badge
          variant={row.variant}
          className={
            row.hasResponded ? "" : "border-destructive/20 bg-destructive/10 text-destructive"
          }
        >
          {row.label}
        </Badge>
      </TableCell>
      <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
        {row.reason}
      </TableCell>
      <TableCell
        suppressHydrationWarning
        className="text-end font-mono text-xs text-muted-foreground"
      >
        {row.formattedDate}
      </TableCell>
    </TableRow>
  );
}
