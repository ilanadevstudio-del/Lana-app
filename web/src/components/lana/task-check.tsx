"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Priority } from "@/lib/data/types";

const RING: Record<Priority, string> = {
  urgent: "border-danger",
  high: "border-warning",
  medium: "border-info",
  low: "border-fg-subtle",
  none: "border-line-strong",
};

/** Round completion control. The ring colour reflects priority. */
export function TaskCheck({
  done,
  priority = "none",
  onToggle,
  label,
  className,
}: {
  done: boolean;
  priority?: Priority;
  onToggle: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "group/check grid size-4 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors",
        done ? "border-accent bg-accent text-on-accent" : cn(RING[priority], "hover:bg-hover"),
        className,
      )}
    >
      <Check
        className={cn("size-2.5 transition-opacity", done ? "opacity-100" : "opacity-0 group-hover/check:opacity-40")}
        strokeWidth={3.5}
      />
    </button>
  );
}

export function PriorityIcon({ priority, className }: { priority: Priority; className?: string }) {
  if (priority === "none") return <span aria-hidden className={cn("inline-block w-3.5 text-center text-fg-faint", className)}>–</span>;
  if (priority === "urgent") {
    return (
      <span aria-hidden className={cn("grid size-3.5 place-items-center rounded-[3px] bg-danger text-[9px] font-bold leading-none text-white", className)}>
        !
      </span>
    );
  }
  const bars = priority === "high" ? 3 : priority === "medium" ? 2 : 1;
  return (
    <svg aria-hidden viewBox="0 0 14 14" className={cn("size-3.5", className)}>
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={1.5 + i * 4}
          y={9 - i * 3}
          width="3"
          height={4 + i * 3}
          rx="0.8"
          className={i < bars ? "fill-fg-muted" : "fill-line-strong"}
        />
      ))}
    </svg>
  );
}
