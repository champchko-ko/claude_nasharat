import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SchoolFullDetails } from "@/lib/school/getSchoolFullDetails";

export function SchoolIdentityFields({
  school,
  canManage,
}: {
  school: SchoolFullDetails;
  canManage: boolean;
}) {
  const t = useTranslations("settings");

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name_ar">{t("nameAr")}</Label>
        <Textarea
          id="name_ar"
          name="name_ar"
          defaultValue={school.name_ar}
          required
          rows={2}
          disabled={!canManage}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name_en">{t("nameEn")}</Label>
        <Textarea
          id="name_en"
          name="name_en"
          defaultValue={school.name_en}
          required
          rows={2}
          disabled={!canManage}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">{t("slug")}</Label>
        <Input
          id="slug"
          name="slug"
          defaultValue={school.slug}
          disabled={!canManage}
          className="font-mono"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="academic_year">{t("academicYear")}</Label>
        <Input
          id="academic_year"
          name="academic_year"
          defaultValue={school.academic_year ?? ""}
          placeholder="مثال: 2026/2027"
          disabled={!canManage}
        />
      </div>
    </>
  );
}
