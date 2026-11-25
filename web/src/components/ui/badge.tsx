import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ACTION_STATUS, TONE_BG, TONE_DOT, TONE_TEXT, type Tone } from "@/lib/status";
import type { ActionStatus } from "@/lib/data/types";

export function Badge({
  tone = "neutral",
  dot,
  icon,
  children,
  className,
  title,
}: {
  tone?: Tone;
  dot?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1.5 whitespace-nowrap rounded px-1.5 text-2xs font-medium [&_svg]:size-3",
        TONE_BG[tone],
        TONE_TEXT[tone],
        className,
      )}
    >
      {dot && <span aria-hidden className={cn("size-1.5 rounded-full", TONE_DOT[tone])} />}
      {icon}
      {children}
    </span>
  );
}

/**
 * Action status, used identically in chat, activity, approvals and projects.
 * "Unverified" gets a hollow dot so it never reads as success.
 */
export function StatusBadge({ status, className }: { status: ActionStatus; className?: string }) {
  const s = ACTION_STATUS[status];
  return (
    <span
      title={s.description}
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1.5 whitespace-nowrap rounded px-1.5 text-2xs font-medium",
        TONE_BG[s.tone],
        TONE_TEXT[s.tone],
        className,
      )}
    >
      <StatusDot status={status} />
      {s.label}
    </span>
  );
}

export function StatusDot({ status, className }: { status: ActionStatus; className?: string }) {
  const s = ACTION_STATUS[status];
  if (status === "unverified" || status === "proposed") {
    return (
      <span
        aria-hidden
        className={cn("size-1.5 shrink-0 rounded-full border border-dashed border-fg-muted", className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "size-1.5 shrink-0 rounded-full",
        TONE_DOT[s.tone],
        status === "executing" && "animate-pulse-ring",
        className,
      )}
    />
  );
}

/** Small uppercase-free label used to mark sample or simulated data. */
export function PreviewTag({ children = "Simulated", className }: { children?: ReactNode; className?: string }) {
  return (
    <span
      title="This is sample data in the preview build. No real service was contacted."
      className={cn(
        "inline-flex h-[18px] shrink-0 items-center rounded border border-dashed border-line-strong px-1.5 text-[10.5px] font-medium text-fg-subtle",
        className,
      )}
    >
      {children}
    </span>
  );
}
