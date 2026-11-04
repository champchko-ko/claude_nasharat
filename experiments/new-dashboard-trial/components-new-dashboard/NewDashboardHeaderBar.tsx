"use client";

import Image from "next/image";
import { NewDashboardHeaderProfile } from "./NewDashboardHeaderProfile";

export function NewDashboardHeaderBar({
  schoolNameAr,
  schoolNameEn,
  managerName,
  onOpenProfile,
}: {
  schoolNameAr: string;
  schoolNameEn: string;
  managerName: string;
  onOpenProfile?: () => void;
}) {
  return (
    <>
      <div
        className="pointer-events-none absolute top-[36px] z-10 -translate-x-1/2 -translate-y-1/2"
        style={{ left: "624px" }}
      >
        <Image
          src="/assets/dashboard/logo.png"
          alt=""
          width={38}
          height={38}
          className="object-contain"
        />
      </div>
      <div
        className="absolute top-[29px] z-10 text-right whitespace-nowrap"
        style={{ right: "calc(844px - 697px)" }}
      >
        <span className="text-[14px] font-extrabold text-[#202e54]">{schoolNameAr}</span>
      </div>
      <div
        className="absolute top-[44px] z-10 text-right text-[6.8px] font-medium tracking-tight whitespace-nowrap text-[#51638b] italic"
        style={{ right: "calc(844px - 697px)" }}
      >
        {schoolNameEn}
      </div>

      <div
        className="absolute top-[32px] z-10 flex items-center gap-1.5 rounded-md px-2 py-0.5 text-right text-[9.6px] font-bold text-[#39486f]"
        style={{ left: "268px" }}
      >
        <Image
          src="/assets/dashboard/flag.png"
          alt="Kuwait"
          width={14}
          height={14}
          className="rounded-full object-cover"
        />
        <span>العربية</span>
      </div>

      <div className="absolute top-[32px] z-10" style={{ left: "214px" }}>
        <button type="button" className="relative p-1 text-[#4a5c86] hover:text-[#202e54]">
          <span className="absolute top-1 right-1 size-1.5 rounded-full bg-red-500" />
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
      </div>

      <NewDashboardHeaderProfile managerName={managerName} onOpenProfile={onOpenProfile} />
    </>
  );
}
