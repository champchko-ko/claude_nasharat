"use client";

import { NewDashboardCanvas } from "./NewDashboardCanvas";
import { NewDashboardModal } from "./NewDashboardModal";
import { useNewDashboardModal } from "./useNewDashboardModal";
import { buildDashboardActivityItems } from "./buildDashboardActivityItems";
import { buildDashboardEventItems } from "./buildDashboardEventItems";
import { resolveDashboardSchoolMeta } from "./resolveDashboardSchoolMeta";
import type { SchoolFullDetails } from "@/lib/school/getSchoolFullDetails";
import type { ProfileRow } from "@/lib/auth/getCurrentProfile";
import type { CircularRow } from "@/lib/circulars/types";
import type { MaintenanceRequestRow } from "@/lib/maintenance/types";
import type { CalendarEventRow } from "@/lib/calendar/types";
import type { SchoolAchievementRow } from "@/lib/achievements/types";

export function NewDashboardView({
  school,
  profile,
  circulars,
  maintenance,
  events,
  achievements,
}: {
  school: SchoolFullDetails | null;
  profile: ProfileRow | null;
  circulars: CircularRow[];
  maintenance: MaintenanceRequestRow[];
  events: CalendarEventRow[];
  achievements: SchoolAchievementRow[];
}) {
  const meta = resolveDashboardSchoolMeta(school, profile);
  const activityItems = buildDashboardActivityItems(circulars, maintenance, achievements);
  const eventItems = buildDashboardEventItems(events);

  const { modal, closeModal, openProfileModal, openStatModal, openActivityModal, openEventModal } =
    useNewDashboardModal({
      circulars,
      maintenance,
      events,
      achievements,
      meta: { ...meta, academicYear: school?.academic_year ?? "2026/2027" },
    });

  return (
    <div className="flex flex-col items-center justify-center overflow-hidden p-2 sm:p-4">
      <NewDashboardCanvas
        {...meta}
        circularsCount={circulars.length}
        maintenanceCount={maintenance.length}
        eventsCount={events.length}
        achievementsCount={achievements.length}
        activityItems={activityItems}
        eventItems={eventItems}
        onOpenProfile={openProfileModal}
        onSelectStat={openStatModal}
        onSelectActivity={openActivityModal}
        onSelectEvent={openEventModal}
      />

      <NewDashboardModal isOpen={modal.isOpen} title={modal.title} onClose={closeModal}>
        {modal.content}
      </NewDashboardModal>
    </div>
  );
}
