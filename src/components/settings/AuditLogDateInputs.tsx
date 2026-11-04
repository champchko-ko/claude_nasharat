import { Input } from "@/components/ui/input";

export function AuditLogDateInputs({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: {
  startDate: string;
  endDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        className="h-9 w-36 text-xs"
      />
      <span className="text-xs text-muted-foreground">-</span>
      <Input
        type="date"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        className="h-9 w-36 text-xs"
      />
    </div>
  );
}
