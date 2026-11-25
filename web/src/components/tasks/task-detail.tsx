"use client";

import { useState, type ReactNode } from "react";
import { CalendarDays, Clock, FolderKanban, Gauge, Sparkles, Trash2, User } from "lucide-react";
import { IntegrationLogo } from "@/components/lana/integration-logo";
import { PriorityIcon, TaskCheck } from "@/components/lana/task-check";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { deleteTask, PRIORITY_LABELS, PRIORITY_ORDER, restoreTask, toggleTask, updateTask } from "@/lib/data/tasks";
import type { Priority, Project, Task, TaskStatus } from "@/lib/data/types";
import { formatRelative } from "@/lib/format";

const STATUS_LABELS: Record<TaskStatus, string> = { todo: "To do", in_progress: "In progress", done: "Done" };

/** Task details in the context panel. Edits save as you go. */
export function TaskDetail({ task, projects, onClose }: { task: Task; projects: Project[]; onClose: () => void }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-start gap-3 px-4 pb-3 pt-4">
        <TaskCheck
          done={task.status === "done"}
          priority={task.priority}
          onToggle={() => toggleTask(task.id)}
          label={task.status === "done" ? "Reopen task" : "Complete task"}
          className="mt-1"
        />
        <TitleField key={task.id} task={task} />
      </div>

      <dl className="flex flex-col gap-px px-2 pb-2">
        <Prop icon={<Gauge />} label="Status">
          <Select
            aria-label="Status"
            value={task.status}
            onChange={(e) =>
              updateTask(task.id, {
                status: e.target.value as TaskStatus,
                completedAt: e.target.value === "done" ? new Date().toISOString() : undefined,
              })
            }
          >
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Prop>
        <Prop icon={<PriorityIcon priority={task.priority} />} label="Priority">
          <Select aria-label="Priority" value={task.priority} onChange={(e) => updateTask(task.id, { priority: e.target.value as Priority })}>
            {PRIORITY_ORDER.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </Select>
        </Prop>
        <Prop icon={<CalendarDays />} label="Due date">
          <input
            type="date"
            aria-label="Due date"
            value={task.due ?? ""}
            onChange={(e) => updateTask(task.id, { due: e.target.value || undefined })}
            className="h-8 w-full rounded-md border border-line bg-panel px-2.5 text-sm text-fg hover:border-line-strong focus:border-accent-line focus:outline-none"
          />
        </Prop>
        <Prop icon={<Clock />} label="Time">
          <input
            type="time"
            aria-label="Due time"
            value={task.dueTime ?? ""}
            disabled={!task.due}
            onChange={(e) => updateTask(task.id, { dueTime: e.target.value || undefined })}
            className="h-8 w-full rounded-md border border-line bg-panel px-2.5 text-sm text-fg hover:border-line-strong focus:border-accent-line focus:outline-none disabled:opacity-50"
          />
        </Prop>
        <Prop icon={<FolderKanban />} label="Project">
          <Select aria-label="Project" value={task.projectId ?? ""} onChange={(e) => updateTask(task.id, { projectId: e.target.value || undefined })}>
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Prop>
      </dl>

      <div className="border-t border-line-subtle px-4 py-4">
        <label htmlFor={`notes-${task.id}`} className="mb-1.5 block text-xs font-medium text-fg-subtle">
          Notes
        </label>
        <NotesField key={task.id} task={task} />
      </div>

      <div className="flex flex-col gap-2 border-t border-line-subtle px-4 py-4 text-xs text-fg-subtle">
        {task.source && (
          <p className="flex items-center gap-2">
            {task.source.integrationId ? (
              <IntegrationLogo id={task.source.integrationId} size={14} bare />
            ) : task.source.kind === "assistant" ? (
              <Sparkles className="size-3.5" />
            ) : (
              <User className="size-3.5" />
            )}
            {task.source.label}
          </p>
        )}
        <p>Created {formatRelative(task.createdAt)}</p>
        {task.completedAt && <p>Completed {formatRelative(task.completedAt)}</p>}
      </div>

      <div className="border-t border-line-subtle px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          icon={<Trash2 />}
          className="text-danger hover:bg-danger-soft hover:text-danger"
          onClick={() => {
            const removed = deleteTask(task.id);
            onClose();
            if (removed)
              toast({ title: "Task deleted", description: removed.title, action: { label: "Undo", onClick: () => restoreTask(removed) } });
          }}
        >
          Delete task
        </Button>
      </div>
    </div>
  );
}

function Prop({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[112px_1fr] items-center gap-2 rounded-md px-2 py-1">
      <dt className="flex items-center gap-2 text-xs text-fg-subtle [&_svg]:size-3.5">
        {icon}
        {label}
      </dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function TitleField({ task }: { task: Task }) {
  const [value, setValue] = useState(task.title);
  const commit = () => {
    const t = value.trim();
    if (t && t !== task.title) updateTask(task.id, { title: t });
    else setValue(task.title);
  };
  return (
    <textarea
      aria-label="Task title"
      value={value}
      rows={1}
      onChange={(e) => setValue(e.target.value.replace(/\n/g, ""))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLTextAreaElement).blur();
        }
      }}
      className="field-sizing-content min-w-0 flex-1 resize-none rounded-md bg-transparent text-base font-semibold leading-6 text-fg focus:outline-none"
    />
  );
}

function NotesField({ task }: { task: Task }) {
  const [value, setValue] = useState(task.notes ?? "");
  return (
    <Textarea
      id={`notes-${task.id}`}
      value={value}
      placeholder="Add context, links or next steps…"
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => value !== (task.notes ?? "") && updateTask(task.id, { notes: value || undefined })}
      rows={4}
    />
  );
}
