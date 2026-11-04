/** Small gold dots + bar that follow panel titles (services-guide). */
export function GoldDots({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`inline-flex shrink-0 items-center gap-[3px] ${className}`}>
      <i className="size-[3px] rounded-full bg-gold" />
      <i className="size-[3px] rounded-full bg-gold" />
      <b className="h-[3px] w-5 rounded-sm bg-gold" />
    </span>
  );
}
