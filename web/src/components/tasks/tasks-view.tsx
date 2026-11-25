"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CircleCheckBig, Columns3, List, Plus, Search, SearchX } from "lucide-react";
import { Container, Page, PageHeader, PageToolbar, SplitView } from "@/components/shell/page";
import { PriorityIcon } from "@/components/lana/task-check";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/controls";
import { EmptyState, ListSkeleton } from "@/components/ui/feedback";
import { FilterMenu } from "@/components/ui/filter-menu";
import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { compareTasks, groupByDue, isDueToday, isOverdue, PRIORITY_LABELS, PRIORITY_ORDER, toggleTask, useTasks } from "@/lib/data/tasks";
import type { Priority, Task } from "@/lib/data/types";
import { useProjects } from "@/lib/data/workspace";
import { dayDiff, formatDay, fromDateKey, toDateKey } from "@/lib/format";
import { isTyping, setUi, useUi } from "@/lib/ui-state";
import { useNow } from "@/lib/use-now";
import { QuickAdd } from "./quick-add";
import { TaskBoard } from "./task-board";
import { TaskDetail } from "./task-detail";
import { TaskRow } from "./task-row";

type View = "today" | "upcoming" | "all" | "overdue" | "completed";

const VIEWS: { value: View; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "all", label: "All" },
  { value: "overdue", label: "Overdue" },
  { value: "completed", label: "Completed" },
];

interface Group {
  id: string;
  label: string;
  tone?: "danger";
  tasks: Task[];
}

function groupsFor(view: View, tasks: Task[], now: Date): Group[] {
  const open = tasks.filter((t) => t.status !== "done");
  switch (view) {
    case "today":
      return groupByDue(open.filter((t) => isOverdue(t, now) || isDueToday(t, now)), now);
    case "overdue":
      return groupByDue(open.filter((t) => isOverdue(t, now)), now);
    case "all":
      return groupByDue(open, now);
    case "upcoming": {
      const map = new Map<string, Task[]>();
      for (const t of open.filter((t) => t.due && dayDiff(fromDateKey(t.due), now) > 0).sort(compareTasks)) {
        map.set(t.due!, [...(map.get(t.due!) ?? []), t]);
      }
      return [...map.entries()].map(([key, list]) => ({ id: key, label: formatDay(fromDateKey(key), now), tasks: list }));
    }
    case "completed": {
      const done = tasks.filter((t) => t.status === "done").sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
      const map = new Map<string, Task[]>();
      for (const t of done) {
        const key = t.completedAt ? toDateKey(new Date(t.completedAt)) : "unknown";
        map.set(key, [...(map.get(key) ?? []), t]);
      }
      return [...map.entries()].map(([key, list]) => ({
        id: key,
        label: key === "unknown" ? "Earlier" : `Completed ${formatDay(fromDateKey(key), now).toLowerCase()}`,
        tasks: list,
      }));
    }
  }
}

const EMPTY: Record<View, { title: string; description: string }> = {
  today: { title: "Nothing due today", description: "Enjoy the space, or pull something forward from Upcoming." },
  upcoming: { title: "Nothing scheduled ahead", description: "Tasks with a future due date will appear here." },
  all: { title: "No open tasks", description: "Add one above, or ask LANA to create tasks from your email." },
  overdue: { title: "Nothing overdue", description: "You're on top of things." },
  completed: { title: "No completed tasks yet", description: "Completed tasks will be listed here." },
};

export function TasksView() {
  const tasks = useTasks();
  const projects = useProjects();
  const now = useNow();
  const [view, setView] = useState<View>("today");
  const [layout, setLayout] = useState<"list" | "board">("list");
  const [project, setProject] = useState("all");
  const [priority, setPriority] = useState<"all" | Priority>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const quickAddRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());

  // Requests from the command menu ("New task", or opening a specific task).
  const quickAddRequested = useUi((s) => s.quickAddRequested);
  const openTaskId = useUi((s) => s.openTaskId);
  useEffect(() => {
    if (quickAddRequested) {
      setUi({ quickAddRequested: false });
      requestAnimationFrame(() => quickAddRef.current?.focus());
    }
  }, [quickAddRequested]);
  useEffect(() => {
    if (openTaskId) {
      setUi({ openTaskId: null });
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot handoff from the command menu
      setSelectedId(openTaskId);
      setView("all");
    }
  }, [openTaskId]);

  const filtered = useMemo(() => {
    if (!tasks) return null;
    const q = query.trim().toLowerCase();
    return tasks.filter(
      (t) =>
        (project === "all" || (project === "none" ? !t.projectId : t.projectId === project)) &&
        (priority === "all" || t.priority === priority) &&
        (!q || t.title.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q)),
    );
  }, [tasks, project, priority, query]);

  const groups = useMemo(() => (filtered && now ? groupsFor(view, filtered, now) : null), [filtered, now, view]);
  const flat = useMemo(() => groups?.flatMap((g) => g.tasks) ?? [], [groups]);
  const selected = tasks?.find((t) => t.id === selectedId) ?? null;

  const counts = useMemo(() => {
    if (!tasks || !now) return null;
    const open = tasks.filter((t) => t.status !== "done");
    return {
      today: open.filter((t) => isOverdue(t, now) || isDueToday(t, now)).length,
      overdue: open.filter((t) => isOverdue(t, now)).length,
    };
  }, [tasks, now]);

  // Keyboard: C new, J/K move, X complete, Enter open, Esc close.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTyping(e) || e.metaKey || e.ctrlKey || e.altKey || document.querySelector("[role=dialog]")) return;
      const idx = flat.findIndex((t) => t.id === selectedId);
      const move = (d: number) => {
        const next = flat[Math.max(0, Math.min(flat.length - 1, (idx === -1 ? (d > 0 ? -1 : flat.length) : idx) + d))];
        if (next) {
          setSelectedId(next.id);
          rowRefs.current.get(next.id)?.focus();
        }
      };
      if (e.key === "c") {
        e.preventDefault();
        quickAddRef.current?.focus();
      } else if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        move(1);
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        move(-1);
      } else if (e.key === "x" && selectedId) {
        e.preventDefault();
        toggleTask(selectedId);
      } else if (e.key === "Escape") setSelectedId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flat, selectedId]);

  const loading = !groups || !projects || !now;

  return (
    <Page>
      <PageHeader
        title="Tasks"
        actions={
          <>
            <Input
              icon={<Search />}
              size="sm"
              placeholder="Search tasks"
              aria-label="Search tasks"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="hidden w-52 sm:flex"
            />
            <Tooltip content="New task" shortcut={["C"]}>
              <Button variant="primary" size="sm" icon={<Plus />} onClick={() => quickAddRef.current?.focus()}>
                <span className="max-sm:sr-only">New task</span>
              </Button>
            </Tooltip>
          </>
        }
      />
      <PageToolbar className="gap-3">
        <nav aria-label="Task views" className="flex items-center gap-0.5">
          {VIEWS.map((v) => {
            const count = v.value === "today" ? counts?.today : v.value === "overdue" ? counts?.overdue : undefined;
            return (
              <button
                key={v.value}
                type="button"
                onClick={() => setView(v.value)}
                aria-current={view === v.value || undefined}
                className={cn(
                  "flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                  view === v.value ? "bg-pressed text-fg" : "text-fg-subtle hover:bg-hover hover:text-fg",
                )}
              >
                {v.label}
                {!!count && (
                  <span className={cn("tabular-nums", v.value === "overdue" ? "text-danger" : "text-fg-subtle")}>{count}</span>
                )}
              </button>
            );
          })}
        </nav>
        <span className="h-4 w-px shrink-0 bg-line" />
        <FilterMenu
          label="Project"
          value={project}
          onChange={setProject}
          options={[
            { value: "all", label: "All" },
            ...(projects ?? []).map((p) => ({ value: p.id, label: p.name })),
            { value: "none", label: "No project" },
          ]}
        />
        <FilterMenu
          label="Priority"
          value={priority}
          onChange={setPriority}
          options={[
            { value: "all" as const, label: "Any" },
            ...PRIORITY_ORDER.map((p) => ({ value: p, label: PRIORITY_LABELS[p], icon: <PriorityIcon priority={p} /> })),
          ]}
        />
        <div className="ml-auto">
          <Segmented
            label="Layout"
            size="sm"
            value={layout}
            onChange={setLayout}
            options={[
              { value: "list", label: "List", icon: <List /> },
              { value: "board", label: "Week", icon: <Columns3 /> },
            ]}
          />
        </div>
      </PageToolbar>

      <SplitView
        asideTitle="Task"
        aside={selected && projects ? <TaskDetail task={selected} projects={projects} onClose={() => setSelectedId(null)} /> : undefined}
        onAsideClose={() => setSelectedId(null)}
      >
        {loading ? (
          <Container className="pt-4">
            <ListSkeleton rows={8} />
          </Container>
        ) : layout === "board" ? (
          <TaskBoard tasks={filtered!} projects={projects} selectedId={selectedId} onSelect={setSelectedId} now={now} />
        ) : (
          <div className="pb-16">
            <div className="px-4 pb-2 pt-4 md:px-5">
              {view !== "completed" && (
                <QuickAdd
                  ref={quickAddRef}
                  projects={projects}
                  defaultDue={view === "today" ? "today" : undefined}
                  defaultProjectId={project !== "all" && project !== "none" ? project : undefined}
                  onCreated={setSelectedId}
                />
              )}
            </div>
            {groups.length === 0 ? (
              query || project !== "all" || priority !== "all" ? (
                <EmptyState
                  icon={<SearchX />}
                  title="No tasks match these filters"
                  action={
                    <Button
                      size="sm"
                      onClick={() => {
                        setQuery("");
                        setProject("all");
                        setPriority("all");
                      }}
                    >
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <EmptyState icon={<CircleCheckBig />} {...EMPTY[view]} />
              )
            ) : (
              groups.map((g) => (
                <section key={g.id} aria-label={g.label} className="mt-2">
                  <h2 className="sticky top-0 z-10 flex h-8 items-center gap-2 border-b border-line-subtle bg-canvas/95 px-4 text-xs font-medium backdrop-blur md:px-5">
                    <span className={g.tone === "danger" ? "text-danger" : "text-fg-muted"}>{g.label}</span>
                    <span className="tabular-nums text-fg-faint">{g.tasks.length}</span>
                  </h2>
                  <ul>
                    {g.tasks.map((t) => (
                      <TaskRow
                        key={t.id}
                        ref={(el) => {
                          if (el) rowRefs.current.set(t.id, el);
                          else rowRefs.current.delete(t.id);
                        }}
                        task={t}
                        project={projects.find((p) => p.id === t.projectId)}
                        selected={selectedId === t.id}
                        onSelect={() => setSelectedId(selectedId === t.id ? null : t.id)}
                        now={now}
                      />
                    ))}
                  </ul>
                </section>
              ))
            )}
          </div>
        )}
      </SplitView>
    </Page>
  );
}
