"use client";

import Link from "next/link";
import Image from "next/image";

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: string;
  y: number;
  active?: boolean;
}

const navItems: DashboardNavItem[] = [
  { label: "لوحة التحكم", href: "/dashboard", icon: "home", y: 80, active: true },
  { label: "التعاميم والمهام", href: "/circulars", icon: "circulars", y: 124 },
  { label: "طلبات الصيانة", href: "/maintenance", icon: "maintenance", y: 168 },
  { label: "التقويم المدرسي", href: "/calendar", icon: "calendar", y: 212 },
  { label: "إنجازات المدرسة", href: "/achievements", icon: "homework", y: 256 },
  { label: "التقارير", href: "/reports", icon: "reports", y: 300 },
  { label: "الإعدادات", href: "/settings", icon: "settings", y: 344 },
];

export function NewDashboardSidebar() {
  return (
    <>
      {/* Top Sparkle / Brand Icon */}
      <div
        className="pointer-events-none absolute top-[28px] z-10 -translate-x-1/2 -translate-y-1/2"
        style={{ left: "810px" }}
      >
        <Image
          src="/assets/dashboard/sparkle.png"
          alt=""
          width={18}
          height={18}
          className="object-contain"
        />
      </div>

      {/* Nav Items */}
      {navItems.map((n) => {
        const isSettings = n.icon === "settings";
        const hasPill = n.active || isSettings;

        return (
          <div key={n.href}>
            {hasPill && (
              <div
                className="pointer-events-none absolute z-10 h-[31px] w-[147px] rounded-[16px] shadow-md"
                style={{
                  left: "684px",
                  top: `${n.y - 15}px`,
                  background: "linear-gradient(90deg, #4259c8, #4b63d3 60%, #4660d0)",
                  boxShadow: "0 4px 12px rgba(55,80,200,.35), inset 0 1px 0 rgba(255,255,255,.18)",
                }}
              />
            )}

            <Link
              href={n.href}
              className="absolute z-20 h-[31px] w-[154px] rounded-[16px] transition hover:bg-white/10"
              style={{ left: "680px", top: `${n.y - 15}px` }}
              title={n.label}
            />

            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: "810px", top: `${n.y}px` }}
            >
              <Image
                src={`/assets/dashboard/nav_${n.icon}.png`}
                alt=""
                width={26}
                height={26}
                className="object-contain"
              />
            </div>

            <div
              className={`pointer-events-none absolute z-10 -translate-y-1/2 text-right text-[11.5px] whitespace-nowrap transition-colors ${
                hasPill ? "font-bold text-white" : "font-medium text-[#eaeef8]"
              }`}
              style={{ right: "calc(844px - 787px)", top: `${n.y}px` }}
            >
              {n.label}
            </div>
          </div>
        );
      })}
    </>
  );
}
