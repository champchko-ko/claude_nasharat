"use client";

import { NewDashboardAchievementList } from "./NewDashboardAchievementList";
import { NewDashboardCircularList } from "./NewDashboardCircularList";
import { NewDashboardEventStatList } from "./NewDashboardEventStatList";
import { NewDashboardMaintenanceList } from "./NewDashboardMaintenanceList";
import type { CircularRow } from "@/lib/circulars/types";
import type { MaintenanceRequestRow } from "@/lib/maintenance/types";
import type { CalendarEventRow } from "@/lib/calendar/types";
import type { SchoolAchievementRow } from "@/lib/achievements/types";

/**
 * Dispatches the trial dashboard stat modal to the list for the chosen stat.
 * Each list lives in its own file (repository rule #1).
 */
export function NewDashboardStatModalContent({
  statId,
  circulars,
  maintenance,
  events,
  achievements,
}: {
  statId: string;
  circulars: CircularRow[];
  maintenance: MaintenanceRequestRow[];
  events: CalendarEventRow[];
  achievements: SchoolAchievementRow[];
}) {
  if (statId === "circulars") return <NewDashboardCircularList circulars={circulars} />;
  if (statId === "maintenance") return <NewDashboardMaintenanceList maintenance={maintenance} />;
  if (statId === "events") return <NewDashboardEventStatList events={events} />;

  return <NewDashboardAchievementList achievements={achievements} />;
}
