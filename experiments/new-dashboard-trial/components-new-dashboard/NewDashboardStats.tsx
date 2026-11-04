"use client";

import Image from "next/image";
import { getNewDashboardStatDefs } from "./getNewDashboardStatDefs";

export function NewDashboardStats({
  circularsCount,
  maintenanceCount,
  eventsCount,
  achievementsCount,
  onSelectStat,
}: {
  circularsCount: number;
  maintenanceCount: number;
  eventsCount: number;
  achievementsCount: number;
  onSelectStat: (id: string) => void;
}) {
  const statDefs = getNewDashboardStatDefs({
    circulars: circularsCount,
    maintenance: maintenanceCount,
    events: eventsCount,
    achievements: achievementsCount,
  });

  return (
    <>
      {statDefs.map((s) => (
        <div key={s.id}>
          <button
            type="button"
            className="absolute top-[222px] z-20 h-[66px] w-[124px] cursor-pointer rounded-2xl transition hover:-translate-y-0.5 hover:shadow-md"
            style={{ left: `${s.left}px` }}
            onClick={() => onSelectStat(s.id)}
            title={s.label}
          />
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${s.iconX}px`, top: `${s.iconY}px` }}
          >
            <Image src={s.icon} alt="" width={32} height={38} className="object-contain" />
          </div>
          <div
            className="pointer-events-none absolute top-[242px] z-10 -translate-y-1/2 text-right text-[9px] font-extrabold whitespace-nowrap"
            style={{ right: `calc(844px - ${s.labelRight}px)`, color: s.labelColor }}
          >
            {s.label}
          </div>
          <div
            className="pointer-events-none absolute top-[272px] z-10 -translate-x-1/2 -translate-y-1/2 text-center text-[25px] font-extrabold whitespace-nowrap"
            style={{ left: `${s.numberX}px`, color: s.numberColor }}
          >
            {s.value}
          </div>
        </div>
      ))}
    </>
  );
}
