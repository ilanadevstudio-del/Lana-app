"use client";

import { addDays, dayDiff, fromDateKey, toDateKey } from "@/lib/format";
import { seedTasks } from "@/lib/mock/tasks";
import { createStore, uid } from "./store";
import type { Priority, Task } from "./types";

/**
 * Tasks data source.
 * PREVIEW: backed by sample data in memory. Replace the store calls with API requests when the backend lands.
 */
const store = createStore<Task[]>(seedTasks);

export const useTasks = store.use;
export const getTasks = store.get;

export function createTask(input: Omit<Task, "id" | "createdAt" | "status"> & { status?: Task["status"] }) {
  const task: Task = { status: "todo", ...input, id: uid("task"), createdAt: new Date().toISOString() };
  store.set((tasks) => [task, ...tasks]);
  return task;
}

export function updateTask(id: string, patch: Partial<Task>) {
  store.set((tasks) => tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)));
}

export function toggleTask(id: string) {
  store.set((tasks) =>
    tasks.map((t) =>
      t.id === id
        ? t.status === "done"
          ? { ...t, status: "todo", completedAt: undefined }
          : { ...t, status: "done", completedAt: new Date().toISOString() }
        : t,
    ),
  );
}

export function deleteTask(id: string) {
  const removed = store.get().find((t) => t.id === id);
  store.set((tasks) => tasks.filter((t) => t.id !== id));
  return removed;
}

export function restoreTask(task: Task) {
  store.set((tasks) => [task, ...tasks]);
}

// ── Selectors ─────────────────────────────────────────────────────────────────

export const PRIORITY_ORDER: Priority[] = ["urgent", "high", "medium", "low", "none"];

export const PRIORITY_LABELS: Record<Priority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "No priority",
};

export function isOverdue(t: Task, now = new Date()) {
  return t.status !== "done" && !!t.due && dayDiff(fromDateKey(t.due), now) < 0;
}

export function isDueToday(t: Task, now = new Date()) {
  return !!t.due && dayDiff(fromDateKey(t.due), now) === 0;
}

export function compareTasks(a: Task, b: Task) {
  const da = a.due ? `${a.due}T${a.dueTime ?? "99:99"}` : "9999";
  const db = b.due ? `${b.due}T${b.dueTime ?? "99:99"}` : "9999";
  if (da !== db) return da < db ? -1 : 1;
  return PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
}

export interface TaskGroup {
  id: string;
  label: string;
  tone?: "danger";
  tasks: Task[];
}

/** Groups open tasks by when they're due. */
export function groupByDue(tasks: Task[], now = new Date()): TaskGroup[] {
  const groups: Record<string, TaskGroup> = {
    overdue: { id: "overdue", label: "Overdue", tone: "danger", tasks: [] },
    today: { id: "today", label: "Today", tasks: [] },
    tomorrow: { id: "tomorrow", label: "Tomorrow", tasks: [] },
    week: { id: "week", label: "Next 7 days", tasks: [] },
    later: { id: "later", label: "Later", tasks: [] },
    none: { id: "none", label: "No date", tasks: [] },
  };
  for (const t of [...tasks].sort(compareTasks)) {
    if (!t.due) groups.none.tasks.push(t);
    else {
      const diff = dayDiff(fromDateKey(t.due), now);
      if (diff < 0) groups.overdue.tasks.push(t);
      else if (diff === 0) groups.today.tasks.push(t);
      else if (diff === 1) groups.tomorrow.tasks.push(t);
      else if (diff < 8) groups.week.tasks.push(t);
      else groups.later.tasks.push(t);
    }
  }
  return Object.values(groups).filter((g) => g.tasks.length > 0);
}

// ── Quick-add parsing ─────────────────────────────────────────────────────────

export interface ParsedTaskInput {
  title: string;
  due?: string;
  priority?: Priority;
  projectHint?: string;
}

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/**
 * Understands a few natural shortcuts in the quick-add field:
 * "today", "tomorrow", a weekday, "!high" / "!!" priorities and "#project".
 */
export function parseTaskInput(raw: string, now = new Date()): ParsedTaskInput {
  let text = ` ${raw} `;
  const out: ParsedTaskInput = { title: "" };

  const take = (re: RegExp) => {
    const m = text.match(re);
    if (m) text = text.replace(m[0], " ");
    return m;
  };

  if (take(/\s(today|tod)\s/i)) out.due = toDateKey(now);
  else if (take(/\s(tomorrow|tmr|tmrw)\s/i)) out.due = toDateKey(addDays(now, 1));
  else {
    const wd = take(new RegExp(`\\s(?:on\\s)?(${WEEKDAYS.join("|")}|${WEEKDAYS.map((d) => d.slice(0, 3)).join("|")})\\s`, "i"));
    if (wd) {
      const idx = WEEKDAYS.findIndex((d) => d.startsWith(wd[1].toLowerCase().slice(0, 3)));
      const delta = ((idx - now.getDay() + 7) % 7) || 7;
      out.due = toDateKey(addDays(now, delta));
    }
  }

  const named = take(/\s!(urgent|high|medium|med|low)\s/i);
  if (named) {
    const word = named[1].toLowerCase();
    out.priority = word === "med" ? "medium" : (word as Priority);
  } else {
    const bangs = take(/\s(!{1,3})\s/);
    if (bangs) out.priority = bangs[1].length === 3 ? "urgent" : bangs[1].length === 2 ? "high" : "medium";
  }

  const proj = take(/\s#([\w-]+)\s/);
  if (proj) out.projectHint = proj[1].toLowerCase();

  out.title = text.replace(/\s+/g, " ").trim();
  return out;
}
