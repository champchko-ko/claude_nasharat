import type { SVGProps } from "react";

export function OperationalPlanIcon({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`custom-doc-icon text-gold ${className}`.trim()}
      {...props}
    >
      {/* Coordinate axes */}
      <path d="M12 13V2M10 4l2-2 2 2" />
      <path d="M12 13h10M20 11l2 2-2 2" />

      {/* Bar chart bars */}
      <rect
        x="3.5"
        y="9.5"
        width="2"
        height="3.5"
        rx="0.5"
        fill="currentColor"
        fillOpacity={0.25}
      />
      <rect
        x="6.5"
        y="6.5"
        width="2"
        height="6.5"
        rx="0.5"
        fill="currentColor"
        fillOpacity={0.45}
      />
      <rect x="9.5" y="3.5" width="2" height="9.5" rx="0.5" fill="currentColor" fillOpacity={0.7} />

      {/* Growth trend line */}
      <path d="M13 10l2.2-4.5 2.3 2.5 2.5-4.5 1.5 2" />

      {/* Graduation mortarboard cap */}
      <path d="M2.5 15.5L12 11.5l9.5 4-9.5 4-9.5-4z" fill="currentColor" fillOpacity={0.15} />
      <path d="M6 17v3c0 2 12 2 12 0v-3" />
      {/* Tassel */}
      <circle cx="12" cy="15.5" r="0.8" fill="currentColor" />
      <path d="M12 15.5l4 2.5v4" />
      <path d="M14.5 22h3" />
    </svg>
  );
}
