"use client";

import { forwardRef } from "react";
import { ProjectChip } from "@/components/lana/project-chip";
import { PriorityIcon, TaskCheck } from "@/components/lana/task-check";
import { cn } from "@/lib/cn";
import { PRIORITY_LABELS, toggleTask } from "@/lib/data/tasks";
import type { Project, Task } from "@/lib/data/types";
import { DueLabel } from "./task-meta";

export const TaskRow = forwardRef<
  HTMLButtonElement,
  { task: Task; project?: Project; selected: boolean; onSelect: () => void; now: Date; showProject?: boolean }
>(function TaskRow({ task, project, selected, onSelect, now, showProject = true }, ref) {
  const done = task.status === "done";
  return (
    <li
      className={cn(
        "group relative flex h-10 items-center gap-3 border-b border-line-subtle pl-4 pr-3 transition-colors md:pl-5",
        selected ? "bg-pressed" : "hover:bg-hover",
      )}
    >
      {selected && <span aria-hidden className="absolute inset-y-0 left-0 w-[2px] bg-accent" />}
      <TaskCheck done={done} priority={task.priority} onToggle={() => toggleTask(task.id)} label={done ? `Reopen ${task.title}` : `Complete ${task.title}`} />
      <button
        ref={ref}
        type="button"
        onClick={onSelect}
        aria-current={selected || undefined}
        className="flex min-w-0 flex-1 items-center gap-2 self-stretch text-left focus-visible:outline-none"
      >
        <span className={cn("truncate text-sm", done ? "text-fg-subtle line-through decoration-fg-faint" : "text-fg")}>{task.title}</span>
        {task.status === "in_progress" && (
          <span className="shrink-0 rounded bg-accent-soft px-1.5 text-2xs font-medium leading-[18px] text-accent-text">In progress</span>
        )}
        {task.labels?.map((l) => (
          <span key={l} className="hidden shrink-0 rounded border border-line px-1.5 text-2xs leading-[16px] text-fg-subtle sm:inline">
            {l}
          </span>
        ))}
      </button>
      {showProject && project && <ProjectChip project={project} className="hidden max-w-40 md:inline-flex" />}
      <DueLabel task={task} now={now} className="w-24 text-right max-sm:w-auto" />
      <span title={PRIORITY_LABELS[task.priority]} className="hidden w-4 justify-center sm:flex">
        <PriorityIcon priority={task.priority} />
      </span>
    </li>
  );
});
