import { cn } from "@/lib/cn";

/**
 * The LANA mark: an "L" formed by two strokes meeting at a point of action,
 * with a small dot that signals "something is about to happen".
 */
export function LanaMark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <rect width="24" height="24" rx="6" fill="var(--accent)" />
      <path d="M8.5 6.5V16.5H16" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16.25" cy="8.25" r="1.75" fill="white" fillOpacity="0.9" />
    </svg>
  );
}

export function LanaWordmark({ className }: { className?: string }) {
  return <span className={cn("text-[15px] font-semibold tracking-[0.12em] text-fg", className)}>LANA</span>;
}
