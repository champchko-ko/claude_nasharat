import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CircularVisibility } from "@/lib/circulars/types";

interface EditCircularVisibilityFieldProps {
  visibility: CircularVisibility;
}

export function EditCircularVisibilityField({ visibility }: EditCircularVisibilityFieldProps) {
  const t = useTranslations("circulars");

  return (
    <div className="space-y-2">
      <Label htmlFor="visibility">{t("visibility")}</Label>
      <Select name="visibility" defaultValue={visibility}>
        <SelectTrigger id="visibility" className="w-full">
          <SelectValue>
            {visibility === "public" ? t("visibilityPublic") : t("visibilityInternal")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="internal">{t("visibilityInternal")}</SelectItem>
          <SelectItem value="public">{t("visibilityPublic")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
