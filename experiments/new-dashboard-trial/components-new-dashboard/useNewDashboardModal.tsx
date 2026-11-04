"use client";

import { useState, type ReactNode } from "react";
import { NewDashboardStatModalContent } from "./NewDashboardStatModalContent";
import { NewDashboardProfileModalContent } from "./NewDashboardProfileModalContent";
import { getStatModalTitle } from "./getStatModalTitle";
import type { ActivityItem } from "./NewDashboardActivityList";
import type { DashboardEventItem } from "./NewDashboardEventList";
import type { CircularRow } from "@/lib/circulars/types";
import type { MaintenanceRequestRow } from "@/lib/maintenance/types";
import type { CalendarEventRow } from "@/lib/calendar/types";
import type { SchoolAchievementRow } from "@/lib/achievements/types";

export function useNewDashboardModal(data: {
  circulars: CircularRow[];
  maintenance: MaintenanceRequestRow[];
  events: CalendarEventRow[];
  achievements: SchoolAchievementRow[];
  meta: { managerName: string; schoolNameAr: string; academicYear: string; visionText: string };
}) {
  const [modal, setModal] = useState<{ isOpen: boolean; title: string; content: ReactNode }>({
    isOpen: false,
    title: "",
    content: null,
  });

  const closeModal = () => setModal((prev) => ({ ...prev, isOpen: false }));

  const openProfileModal = () =>
    setModal({
      isOpen: true,
      title: "بيانات المدرسة والملف الإداري",
      content: <NewDashboardProfileModalContent {...data.meta} />,
    });

  const openStatModal = (id: string) =>
    setModal({
      isOpen: true,
      title: getStatModalTitle(id),
      content: (
        <NewDashboardStatModalContent
          statId={id}
          circulars={data.circulars}
          maintenance={data.maintenance}
          events={data.events}
          achievements={data.achievements}
        />
      ),
    });

  const openActivityModal = (item: ActivityItem) =>
    setModal({
      isOpen: true,
      title: item.text,
      content: <p className="text-xs leading-relaxed text-muted-foreground">{item.desc}</p>,
    });

  const openEventModal = (item: DashboardEventItem) =>
    setModal({
      isOpen: true,
      title: item.title,
      content: (
        <div className="rounded-lg border bg-muted/30 p-3 text-xs">
          <div className="mb-1 font-bold text-foreground">{item.title}</div>
          <div className="text-muted-foreground">
            التاريخ: {item.date} · الموقع: {item.loc}
          </div>
        </div>
      ),
    });

  return { modal, closeModal, openProfileModal, openStatModal, openActivityModal, openEventModal };
}
