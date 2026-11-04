"use client";

import Image from "next/image";
import { NewDashboardHeaderBar } from "./NewDashboardHeaderBar";
import { NewDashboardHero } from "./NewDashboardHero";
import { NewDashboardSidebar } from "./NewDashboardSidebar";
import { NewDashboardStats } from "./NewDashboardStats";
import { NewDashboardActivityList, type ActivityItem } from "./NewDashboardActivityList";
import { NewDashboardEventList, type DashboardEventItem } from "./NewDashboardEventList";

export function NewDashboardCanvas({
  schoolNameAr,
  schoolNameEn,
  managerName,
  visionText,
  circularsCount,
  maintenanceCount,
  eventsCount,
  achievementsCount,
  activityItems,
  eventItems,
  onOpenProfile,
  onSelectStat,
  onSelectActivity,
  onSelectEvent,
}: {
  schoolNameAr: string;
  schoolNameEn: string;
  managerName: string;
  visionText: string;
  circularsCount: number;
  maintenanceCount: number;
  eventsCount: number;
  achievementsCount: number;
  activityItems: ActivityItem[];
  eventItems: DashboardEventItem[];
  onOpenProfile: () => void;
  onSelectStat: (id: string) => void;
  onSelectActivity: (item: ActivityItem) => void;
  onSelectEvent: (item: DashboardEventItem) => void;
}) {
  return (
    <div className="relative h-[491px] w-[844px] overflow-hidden rounded-2xl border border-slate-200/40 shadow-xl">
      <Image
        src="/assets/dashboard/plate.png"
        alt=""
        fill
        priority
        className="pointer-events-none object-cover"
      />

      <NewDashboardSidebar />

      <NewDashboardHeaderBar
        schoolNameAr={schoolNameAr}
        schoolNameEn={schoolNameEn}
        managerName={managerName}
        onOpenProfile={onOpenProfile}
      />

      <NewDashboardHero visionText={visionText} />

      <NewDashboardStats
        circularsCount={circularsCount}
        maintenanceCount={maintenanceCount}
        eventsCount={eventsCount}
        achievementsCount={achievementsCount}
        onSelectStat={onSelectStat}
      />

      <NewDashboardActivityList items={activityItems} onSelectActivity={onSelectActivity} />

      <NewDashboardEventList items={eventItems} onSelectEvent={onSelectEvent} />
    </div>
  );
}
