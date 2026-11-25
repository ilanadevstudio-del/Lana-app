"use client";

import { forwardRef, useState } from "react";
import { CalendarDays, CornerDownLeft, Plus } from "lucide-react";
import { ProjectChip } from "@/components/lana/project-chip";
import { PriorityIcon } from "@/components/lana/task-check";
import { Kbd } from "@/components/ui/kbd";
import { toast } from "@/components/ui/toast";
import { createTask, parseTaskInput, PRIORITY_LABELS } from "@/lib/data/tasks";
import type { Project } from "@/lib/data/types";
import { formatDay, fromDateKey, toDateKey } from "@/lib/format";

/**
 * Inline task creation. Understands "today", "tomorrow", weekdays, "!high" / "!!" and "#project".
 * Parsed values preview as chips before the task is created.
 */
export const QuickAdd = forwardRef<
  HTMLInputElement,
  { projects: Project[]; defaultDue?: "today"; defaultProjectId?: string; onCreated?: (id: string) => void }
>(function QuickAdd({ projects, defaultDue, defaultProjectId, onCreated }, ref) {
  const [value, setValue] = useState("");
  const parsed = parseTaskInput(value);
  const project = parsed.projectHint
    ? projects.find(
        (p) =>
          p.id.startsWith(parsed.projectHint!) ||
          p.key.toLowerCase() === parsed.projectHint ||
          p.name.toLowerCase().replace(/\s+/g, "").startsWith(parsed.projectHint!),
      )
    : projects.find((p) => p.id === defaultProjectId);
  const due = parsed.due ?? (defaultDue === "today" ? toDateKey(new Date()) : undefined);
  const showPreview = value.trim().length > 0;

  function submit() {
    if (!parsed.title) return;
    const task = createTask({
      title: parsed.title,
      priority: parsed.priority ?? "none",
      due,
      projectId: project?.id,
      source: { kind: "manual", label: "Added by you" },
    });
    setValue("");
    onCreated?.(task.id);
    toast({ title: "Task created", description: task.title, tone: "success" });
  }

  return (
    <div className="rounded-lg border border-line bg-panel transition-colors focus-within:border-line-strong">
      <div className="flex h-10 items-center gap-2.5 px-3">
        <Plus className="size-4 shrink-0 text-fg-subtle" />
        <input
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
            if (e.key === "Escape") (e.target as HTMLInputElement).blur();
          }}
          aria-label="New task"
          placeholder="Add a task…   try “Send deck to Kemi tomorrow !high #eventfi”"
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-fg placeholder:text-fg-faint focus:outline-none"
        />
        {showPreview ? (
          <span className="flex items-center gap-1 text-2xs text-fg-subtle">
            <CornerDownLeft className="size-3" /> to add
          </span>
        ) : (
          <Kbd className="max-sm:hidden">C</Kbd>
        )}
      </div>
      {showPreview && (parsed.due || parsed.priority || project || due) && (
        <div className="flex flex-wrap items-center gap-3 border-t border-line-subtle px-3 py-1.5 text-xs text-fg-muted">
          {due && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5 text-fg-subtle" />
              {formatDay(fromDateKey(due))}
            </span>
          )}
          {parsed.priority && (
            <span className="inline-flex items-center gap-1.5">
              <PriorityIcon priority={parsed.priority} />
              {PRIORITY_LABELS[parsed.priority]}
            </span>
          )}
          {project && <ProjectChip project={project} />}
          {parsed.projectHint && !project && <span className="text-warning">No project matches #{parsed.projectHint}</span>}
        </div>
      )}
    </div>
  );
});
