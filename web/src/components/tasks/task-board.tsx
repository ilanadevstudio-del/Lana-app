"use client";

import { useState } from "react";
import { ProjectChip } from "@/components/lana/project-chip";
import { PriorityIcon, TaskCheck } from "@/components/lana/task-check";
import { cn } from "@/lib/cn";
import { compareTasks, isOverdue, toggleTask, updateTask } from "@/lib/data/tasks";
import type { Project, Task } from "@/lib/data/types";
import { addDays, formatShortDate, formatWeekday, toDateKey } from "@/lib/format";

/**
 * Calendar-oriented view: overdue + the next seven days as columns.
 * Drag a card onto another day to reschedule it (or change the date in the detail panel).
 */
export function TaskBoard({
  tasks,
  projects,
  selectedId,
  onSelect,
  now,
}: {
  tasks: Task[];
  projects: Project[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  now: Date;
}) {
  const [over, setOver] = useState<string | null>(null);
  const days = Array.from({ length: 7 }, (_, i) => addDays(now, i));
  const open = tasks.filter((t) => t.status !== "done" || (t.completedAt && t.due));
  const overdue = open.filter((t) => isOverdue(t, now)).sort(compareTasks);

  const columns = [
    ...(overdue.length ? [{ key: "overdue", title: "Overdue", sub: `${overdue.length}`, tasks: overdue, danger: true }] : []),
    ...days.map((d, i) => {
      const key = toDateKey(d);
      return {
        key,
        title: i === 0 ? "Today" : i === 1 ? "Tomorrow" : formatWeekday(d),
        sub: formatShortDate(d),
        tasks: open.filter((t) => t.due === key).sort(compareTasks),
        danger: false,
      };
    }),
  ];

  return (
    <div className="flex h-full gap-3 overflow-x-auto px-4 py-4 md:px-5">
      {columns.map((col) => (
        <section
          key={col.key}
          aria-label={col.title}
          onDragOver={(e) => {
            if (col.key === "overdue") return;
            e.preventDefault();
            setOver(col.key);
          }}
          onDragLeave={() => setOver((o) => (o === col.key ? null : o))}
          onDrop={(e) => {
            e.preventDefault();
            setOver(null);
            const id = e.dataTransfer.getData("text/task");
            if (id && col.key !== "overdue") updateTask(id, { due: col.key });
          }}
          className={cn(
            "flex w-[260px] shrink-0 flex-col rounded-lg border bg-panel transition-colors",
            over === col.key ? "border-accent-line bg-accent-soft/30" : "border-line-subtle",
          )}
        >
          <header className="flex h-10 items-baseline gap-2 px-3 pt-3">
            <h3 className={cn("text-sm font-medium", col.danger ? "text-danger" : "text-fg")}>{col.title}</h3>
            <span className="text-xs text-fg-subtle">{col.sub}</span>
            <span className="ml-auto text-xs tabular-nums text-fg-faint">{col.tasks.length}</span>
          </header>
          <ul className="flex min-h-24 flex-1 flex-col gap-1.5 overflow-y-auto p-2">
            {col.tasks.map((t) => {
              const project = projects.find((p) => p.id === t.projectId);
              const done = t.status === "done";
              return (
                <li
                  key={t.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/task", t.id)}
                  className={cn(
                    "group cursor-grab rounded-md border bg-raised p-2.5 transition-colors active:cursor-grabbing",
                    selectedId === t.id ? "border-accent-line" : "border-line hover:border-line-strong",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <TaskCheck done={done} priority={t.priority} onToggle={() => toggleTask(t.id)} label={`Complete ${t.title}`} className="mt-0.5" />
                    <button
                      type="button"
                      onClick={() => onSelect(t.id)}
                      className={cn("min-w-0 flex-1 text-left text-sm leading-5", done ? "text-fg-subtle line-through" : "text-fg")}
                    >
                      {t.title}
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2 pl-6">
                    {project && <ProjectChip project={project} className="max-w-36" />}
                    <span className="ml-auto flex items-center gap-1.5 text-2xs text-fg-subtle">
                      {t.dueTime}
                      <PriorityIcon priority={t.priority} />
                    </span>
                  </div>
                </li>
              );
            })}
            {col.tasks.length === 0 && (
              <li className="grid flex-1 place-items-center rounded-md border border-dashed border-line-subtle py-6 text-xs text-fg-faint">
                {col.key === "overdue" ? "Nothing overdue" : "Drop tasks here"}
              </li>
            )}
          </ul>
        </section>
      ))}
    </div>
  );
}
