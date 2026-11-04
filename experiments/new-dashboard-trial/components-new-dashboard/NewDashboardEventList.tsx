"use client";

import Image from "next/image";

export interface DashboardEventItem {
  id: string;
  title: string;
  date: string;
  loc: string;
  icon: string;
  cy: number;
  bg: string;
}

export function NewDashboardEventList({
  items,
  onSelectEvent,
}: {
  items: DashboardEventItem[];
  onSelectEvent: (item: DashboardEventItem) => void;
}) {
  return (
    <>
      <div
        className="absolute top-[342px] z-10 -translate-y-1/2 text-right text-[12.4px] font-extrabold whitespace-nowrap text-[#27366f]"
        style={{ right: "calc(844px - 401px)" }}
      >
        التقويم والفعاليات القادمة
      </div>

      {items.map((e) => (
        <div key={e.id}>
          {/* Hitbox */}
          <button
            type="button"
            className="absolute z-20 h-[38px] w-[184px] cursor-pointer rounded-lg transition hover:bg-[#27366f]/5"
            style={{ left: "226px", top: `${e.cy - 18}px` }}
            onClick={() => onSelectEvent(e)}
            title={e.title}
          />
          {/* Badge Background */}
          <div
            className="pointer-events-none absolute z-10 size-[28px] -translate-x-1/2 -translate-y-1/2 rounded-[9px] shadow-xs"
            style={{ left: "394px", top: `${e.cy}px`, backgroundColor: e.bg }}
          />
          {/* Icon */}
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: "394px", top: `${e.cy}px` }}
          >
            <Image src={e.icon} alt="" width={22} height={22} className="object-contain" />
          </div>
          {/* Title */}
          <div
            className="pointer-events-none absolute z-10 -translate-y-1/2 text-right text-[10.2px] font-bold whitespace-nowrap text-[#2f4577]"
            style={{ right: "calc(844px - 369px)", top: `${e.cy - 4}px` }}
          >
            {e.title}
          </div>
          {/* Subtext / Date */}
          <div
            className="pointer-events-none absolute z-10 -translate-y-1/2 text-right text-[8.4px] font-medium whitespace-nowrap text-[#8d94b0]"
            style={{ right: "calc(844px - 369px)", top: `${e.cy + 13}px` }}
          >
            {e.date}
          </div>
          {/* Chevron */}
          <svg
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: "231px", top: `${e.cy + 5}px` }}
            width="6"
            height="9"
            viewBox="0 0 7 10"
          >
            <path
              d="M5.5 1L1.5 5l4 4"
              fill="none"
              stroke="#4a5d95"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ))}
    </>
  );
}
