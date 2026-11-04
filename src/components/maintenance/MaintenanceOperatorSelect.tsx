"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import type { SchoolUserRow } from "@/lib/school/getSchoolUsers";

/**
 * The operator picker of the assignment form.
 *
 * Kept in its own file so the surrounding section stays inside the file-size
 * cap; it only owns the select, not the submit.
 */
export function MaintenanceOperatorSelect({
  currentOperatorId,
  isPending,
  operators,
}: {
  currentOperatorId: string | null;
  isPending: boolean;
  operators: SchoolUserRow[];
}) {
  const t = useTranslations("maintenance");

  return (
    <div className="space-y-2">
      <Label htmlFor="operator_id">{t("assignedOperator")} *</Label>
      <select
        id="operator_id"
        name="operator_id"
        defaultValue={currentOperatorId ?? ""}
        required
        disabled={isPending || operators.length === 0}
        className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
      >
        <option value="">{t("actions.selectOperator")}</option>
        {operators.map((op) => (
          <option key={op.id} value={op.id}>
            {op.full_name}
          </option>
        ))}
      </select>
    </div>
  );
}
