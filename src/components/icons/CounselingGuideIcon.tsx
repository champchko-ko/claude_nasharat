import type { SVGProps } from "react";

export function CounselingGuideIcon({ className = "", ...props }: SVGProps<SVGSVGElement>) {
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
      {/* Speech bubble with lightbulb on top right */}
      <rect x="15" y="1.5" width="7.5" height="7" rx="2" fill="currentColor" fillOpacity={0.15} />
      <path d="M16.5 8.5L15 10.5v-2" />
      {/* Lightbulb in speech bubble */}
      <circle cx="18.7" cy="4.5" r="1.5" fill="currentColor" />
      <path d="M18.7 6v1.2M17.7 7.2h2" strokeWidth={1.4} />

      {/* Student on the left */}
      <circle cx="7" cy="7.5" r="2.2" />
      <path d="M4 14.5c0-2.5 6-2.5 6 0" fill="currentColor" fillOpacity={0.2} />

      {/* Counselor on the right */}
      <circle cx="16" cy="11.5" r="2.2" />
      <path d="M13.5 18c0-3 6.5-3 6.5 0" fill="currentColor" fillOpacity={0.2} />
      {/* Guiding hand */}
      <path d="M14 15l-3-1" />

      {/* Desk */}
      <path d="M2.5 15h11l-1.5 5.5H3z" fill="currentColor" fillOpacity={0.15} />
    </svg>
  );
}
