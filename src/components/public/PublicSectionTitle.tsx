import type { ReactNode } from "react";

function Dots({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`hidden items-center gap-1 sm:flex ${className}`}>
      <i className="size-1 rounded-full bg-gold" />
      <i className="size-1 rounded-full bg-gold" />
      <i className="size-1 rounded-full bg-gold" />
      <b className="h-[3px] w-[30px] rounded-sm bg-gold" />
    </span>
  );
}

function Spark({ smallAt }: { smallAt: "start" | "end" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 40" className="size-8 shrink-0 text-primary sm:size-[34px]">
      <path d="M20 3l3.5 11.5L35 18l-11.5 3.5L20 33l-3.5-11.5L5 18l11.5-3.5z" fill="currentColor" />
      <path
        className="fill-gold"
        d={
          smallAt === "end"
            ? "M31 25l1.6 4.4L37 31l-4.4 1.6L31 37l-1.6-4.4L25 31l4.4-1.6z"
            : "M9 25l1.6 4.4L15 31l-4.4 1.6L9 37l-1.6-4.4L3 31l4.4-1.6z"
        }
      />
    </svg>
  );
}

/** Section heading from the services guide: gold dots + sparkles around the title. */
export function PublicSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="flex flex-wrap items-center justify-center gap-3.5 font-heading text-2xl font-extrabold tracking-tight text-primary sm:text-4xl">
      <Dots />
      <Spark smallAt="end" />
      <span>{children}</span>
      <Spark smallAt="start" />
      <Dots className="flex-row-reverse" />
    </h2>
  );
}
