"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { LocationRow } from "@/lib/school/getSchoolLocations";
import { LocationTableRow } from "./LocationTableRow";
import { EditLocationDialog } from "./EditLocationDialog";

export function LocationList({
  locations,
  canManage,
}: {
  locations: LocationRow[];
  canManage: boolean;
}) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const [editingLoc, setEditingLoc] = useState<LocationRow | null>(null);

  if (locations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
        {tCommon("noData")}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("building")}</TableHead>
              <TableHead>{t("floor")}</TableHead>
              <TableHead>{t("room")}</TableHead>
              <TableHead>{t("kind")}</TableHead>
              <TableHead className="w-28">{tCommon("status")}</TableHead>
              {canManage && <TableHead className="w-44 text-end">{tCommon("actions")}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((loc) => (
              <LocationTableRow
                key={loc.id}
                loc={loc}
                canManage={canManage}
                onEdit={() => setEditingLoc(loc)}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {editingLoc && (
        <EditLocationDialog
          location={editingLoc}
          isOpen={Boolean(editingLoc)}
          onClose={() => setEditingLoc(null)}
        />
      )}
    </>
  );
}
