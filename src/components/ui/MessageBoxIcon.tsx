import { CircleCheckIcon, OctagonXIcon, TriangleAlertIcon, InfoIcon } from "lucide-react";
import type { MessageBoxType } from "@/lib/feedback/types";

export function MessageBoxIcon({ type }: { type: MessageBoxType }) {
  switch (type) {
    case "success":
      return <CircleCheckIcon className="size-6 text-primary" />;
    case "error":
      return <OctagonXIcon className="size-6 text-destructive" />;
    case "warning":
      return <TriangleAlertIcon className="size-6 text-warning" />;
    case "info":
    default:
      return <InfoIcon className="size-6 text-primary" />;
  }
}
