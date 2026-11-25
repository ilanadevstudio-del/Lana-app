import { cn } from "@/lib/cn";
import type { Task } from "@/lib/data/types";
import { dayDiff, formatDay, fromDateKey } from "@/lib/format";

/** Due date text with tone: red when overdue, accent for today. */
export function dueInfo(task: Task, now = new Date()) {
  if (!task.due) return null;
  const date = fromDateKey(task.due);
  const diff = dayDiff(date, now);
  const done = task.status === "done";
  const text = `${formatDay(date, now)}${task.dueTime ? `, ${task.dueTime}` : ""}`;
  const tone = done ? "muted" : diff < 0 ? "danger" : diff === 0 ? "accent" : "muted";
  return { text, tone } as const;
}

export function DueLabel({ task, now, className }: { task: Task; now?: Date; className?: string }) {
  const info = dueInfo(task, now);
  if (!info) return null;
  return (
    <span
      className={cn(
        "shrink-0 whitespace-nowrap text-xs tabular-nums",
        info.tone === "danger" ? "text-danger" : info.tone === "accent" ? "text-accent-text" : "text-fg-subtle",
        className,
      )}
    >
      {info.text}
    </span>
  );
}
