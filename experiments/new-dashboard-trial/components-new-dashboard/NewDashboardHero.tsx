"use client";

export function NewDashboardHero({ visionText }: { visionText: string }) {
  return (
    <>
      <div
        className="absolute top-[100px] z-10 text-right text-[22px] font-extrabold text-[#141d47]"
        style={{ right: "calc(844px - 586px)" }}
      >
        مرحباً بِكِ
      </div>
      <div
        className="absolute top-[132px] z-10 text-right text-[15px] font-extrabold text-[#0f2559]"
        style={{ right: "calc(844px - 586px)" }}
      >
        في لوحة إدارة المدرسة
      </div>
      <div
        className="absolute top-[160px] z-10 max-w-[280px] text-right text-[11px] font-semibold text-[#4c6490]"
        style={{ right: "calc(844px - 586px)" }}
      >
        {visionText || "الريادة والتميز في بيئة تعليمية محفزة"}
      </div>
    </>
  );
}
