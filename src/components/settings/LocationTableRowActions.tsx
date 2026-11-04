import { PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LocationTableRowActions({
  isActive,
  isPending,
  onEdit,
  onToggle,
  onDelete,
  tCommon,
}: {
  isActive: boolean;
  isPending: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  tCommon: (key: string) => string;
}) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={onEdit}
        title={tCommon("edit")}
      >
        <PencilIcon className="size-3.5" />
      </Button>
      <Button variant="outline" size="sm" disabled={isPending} onClick={onToggle}>
        {isActive ? tCommon("inactive") : tCommon("active")}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        disabled={isPending}
        onClick={onDelete}
        title={tCommon("delete")}
      >
        <Trash2Icon className="size-3.5" />
      </Button>
    </div>
  );
}
