import type { SVGProps } from "react";

export function CommitteesGuideIcon({ className = "", ...props }: SVGProps<SVGSVGElement>) {
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
      {/* Three committee members: heads */}
      <circle cx="12" cy="5" r="2.2" fill="currentColor" />
      <circle cx="6" cy="7.5" r="1.8" fill="currentColor" />
      <circle cx="18" cy="7.5" r="1.8" fill="currentColor" />

      {/* Committee members: shoulders/torsos */}
      <path d="M9.2 12c-.2-2.5 5.8-2.5 5.6 0" fill="currentColor" fillOpacity={0.2} />
      <path d="M3.5 13.5c-.2-2.2 4.7-2.5 5 0" fill="currentColor" fillOpacity={0.2} />
      <path d="M15.5 13.5c.3-2.5 5.2-2.2 5 0" fill="currentColor" fillOpacity={0.2} />

      {/* Committee desk / podium */}
      <rect x="5.5" y="12" width="13" height="4" rx="1.5" fill="currentColor" />
      <path d="M7.5 16h9v3.5h-9z" fill="currentColor" fillOpacity={0.3} />

      {/* Foreground stage / conference arc */}
      <path d="M3 22c0-4.5 18-4.5 18 0" fill="currentColor" fillOpacity={0.2} />
    </svg>
  );
}
