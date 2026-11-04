import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { GoldDots } from "@/components/ui/gold-dots";
import { resolveRoleDisplayName } from "@/lib/rbac/resolveRoleDisplayName";
import type { CircularDetail } from "@/lib/circulars/getCircularById";

export function CircularDetailTargets({
  circular,
  totalDepartments,
}: {
  circular: CircularDetail;
  totalDepartments?: number;
}) {
  const t = useTranslations("circulars");
  const tRbac = useTranslations("rbac");

  const isAllTargets =
    !circular.targets ||
    circular.targets.length === 0 ||
    (typeof totalDepartments === "number" &&
      totalDepartments > 0 &&
      circular.targets.length >= totalDepartments);

  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-2 text-xs font-extrabold text-primary">
        {t("targetedDepartments")}
        <GoldDots />
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {isAllTargets ? (
          <Badge variant="secondary" className="font-semibold">
            {t("allDepartments")}
          </Badge>
        ) : (
          circular.targets.map((tgt) => (
            <Badge key={tgt.id} variant="secondary">
              {tgt.department_name ??
                (tgt.role_key ? resolveRoleDisplayName(tgt.role_key, tRbac) : t("allDepartments"))}
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}
