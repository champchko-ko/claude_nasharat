"use client";

import Image from "next/image";

export interface ActivityItem {
  id: string;
  text: string;
  time: string;
  desc: string;
  icon: string;
  cy: number;
  bg: string;
}

export function NewDashboardActivityList({
  items,
  onSelectActivity,
}: {
  items: ActivityItem[];
  onSelectActivity: (item: ActivityItem) => void;
}) {
  return (
    <>
      <div
        className="absolute top-[331px] z-10 -translate-y-1/2 text-right text-[9.6px] font-extrabold whitespace-nowrap text-[#2e3b6e]"
        style={{ right: "calc(844px - 645px)" }}
      >
        أحدث النشاطات المعتمدة
      </div>

      {items.map((a) => (
        <div key={a.id}>
          {/* Hitbox */}
          <button
            type="button"
            className="absolute z-20 h-[36px] w-[184px] cursor-pointer rounded-lg transition hover:bg-[#2e3b6e]/5"
            style={{ left: "474px", top: `${a.cy - 18}px` }}
            onClick={() => onSelectActivity(a)}
            title={a.text}
          />
          {/* Badge Background */}
          <div
            className="pointer-events-none absolute z-10 size-[30px] -translate-x-1/2 -translate-y-1/2 rounded-[10px] shadow-xs"
            style={{ left: "635px", top: `${a.cy}px`, backgroundColor: a.bg }}
          />
          {/* Icon */}
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: "635px", top: `${a.cy}px` }}
          >
            <Image src={a.icon} alt="" width={22} height={22} className="object-contain" />
          </div>
          {/* Text */}
          <div
            className="pointer-events-none absolute z-10 -translate-y-1/2 text-right text-[10.2px] font-bold whitespace-nowrap text-[#3f5c86]"
            style={{ right: "calc(844px - 612px)", top: `${a.cy - 4}px` }}
          >
            {a.text}
          </div>
          {/* Subtext / Time */}
          <div
            className="pointer-events-none absolute z-10 -translate-y-1/2 text-right text-[8.4px] font-medium whitespace-nowrap text-[#8d9db3]"
            style={{ right: "calc(844px - 612px)", top: `${a.cy + 12}px` }}
          >
            {a.time}
          </div>
        </div>
      ))}
    </>
  );
}
