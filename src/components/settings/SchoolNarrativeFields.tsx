import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function SchoolNarrativeFields({
  visionAr,
  visionEn,
  missionAr,
  missionEn,
  disabled,
}: {
  visionAr?: string | null;
  visionEn?: string | null;
  missionAr?: string | null;
  missionEn?: string | null;
  disabled: boolean;
}) {
  const t = useTranslations("settings");

  return (
    <>
      <div className="border-t border-border pt-2 sm:col-span-2">
        <h3 className="text-sm font-semibold text-foreground">
          {t("vision")} &amp; {t("mission")}
        </h3>
      </div>
      <div className="space-y-2">
        <Label htmlFor="vision_ar">{t("visionAr")}</Label>
        <Textarea
          id="vision_ar"
          name="vision_ar"
          defaultValue={visionAr ?? undefined}
          disabled={disabled}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="vision_en">{t("visionEn")}</Label>
        <Textarea
          id="vision_en"
          name="vision_en"
          defaultValue={visionEn ?? undefined}
          disabled={disabled}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mission_ar">{t("missionAr")}</Label>
        <Textarea
          id="mission_ar"
          name="mission_ar"
          defaultValue={missionAr ?? undefined}
          disabled={disabled}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mission_en">{t("missionEn")}</Label>
        <Textarea
          id="mission_en"
          name="mission_en"
          defaultValue={missionEn ?? undefined}
          disabled={disabled}
          rows={3}
        />
      </div>
    </>
  );
}
