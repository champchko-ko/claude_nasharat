"use client";

import Image from "next/image";

/** The signed-in manager block of the trial header. */
export function NewDashboardHeaderProfile({
  managerName,
  onOpenProfile,
}: {
  managerName: string;
  onOpenProfile?: () => void;
}) {
  return (
    <div
      className="absolute top-[28px] z-10 flex cursor-pointer items-center gap-2"
      style={{ left: "64px" }}
      onClick={onOpenProfile}
    >
      <div className="size-8 overflow-hidden rounded-full border border-white/60 shadow-xs">
        <Image
          src="/assets/dashboard/avatar.png"
          alt=""
          width={32}
          height={32}
          className="object-cover"
        />
      </div>
      <div className="flex flex-col text-right">
        <span className="text-[11px] font-extrabold whitespace-nowrap text-[#27406c] hover:underline">
          {managerName}
        </span>
        <span className="text-[7.6px] font-semibold whitespace-nowrap text-[#6b7da0]">
          مدير المدرسة
        </span>
      </div>
    </div>
  );
}
