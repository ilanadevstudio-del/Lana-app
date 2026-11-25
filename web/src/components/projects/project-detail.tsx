"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brain, Check, ChevronDown, FolderX, MessageSquare, Sparkles } from "lucide-react";
import { Panel } from "@/components/home/panel";
import { CATEGORY_BG } from "@/components/lana/category";
import { IntegrationLogo } from "@/components/lana/integration-logo";
import { ProjectTile } from "@/components/lana/project-chip";
import { Page, PageHeader } from "@/components/shell/page";
import { StatusBadge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { Textarea } from "@/components/ui/input";
import { Menu, MenuContent, MenuRadioGroup, MenuRadioItem, MenuTrigger } from "@/components/ui/menu";
import { toast } from "@/components/ui/toast";
import { TaskDetail } from "@/components/tasks/task-detail";
import { TaskRow } from "@/components/tasks/task-row";
import { Sheet } from "@/components/ui/overlays";
import { QuickAdd } from "@/components/tasks/quick-add";
import { startConversation } from "@/lib/assistant/engine";
import { cn } from "@/lib/cn";
import { useActivity } from "@/lib/data/activity";
import { useCalendars, useEvents } from "@/lib/data/calendar";
import { integrationName } from "@/lib/data/integration-catalog";
import { useMemory } from "@/lib/data/memory";
import { compareTasks, useTasks } from "@/lib/data/tasks";
import type { Project, ProjectStatus } from "@/lib/data/types";
import { updateProject, useConnections, useProjects } from "@/lib/data/workspace";
import { dayDiff, formatDay, formatRelative, formatShortDate, formatTime } from "@/lib/format";
import { useNow } from "@/lib/use-now";
import { PROJECT_STATUS, ProgressBar, ProjectStatusBadge } from "./project-status";

export function ProjectDetail({ id }: { id: string }) {
  const projects = useProjects();
  if (!projects) return <DetailSkeleton />;
  const project = projects.find((p) => p.id === id);
  if (!project) {
    return (
      <Page>
        <PageHeader title="Project not found" crumbs={[{ label: "Projects", href: "/projects" }]} />
        <EmptyState
          icon={<FolderX />}
          title="This project doesn't exist"
          description="It may have been removed. Projects created in the preview reset when you reload."
          action={
            <Link href="/projects" className={buttonStyles({ variant: "primary" })}>
              All projects
            </Link>
          }
        />
      </Page>
    );
  }
  return <Detail project={project} projects={projects} />;
}

function Detail({ project, projects }: { project: Project; projects: Project[] }) {
  const router = useRouter();
  const now = useNow();
  const tasks = useTasks();
  const activity = useActivity();
  const events = useEvents();
  const calendars = useCalendars();
  const memory = useMemory();
  const connections = useConnections();
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);

  const pt = tasks?.filter((t) => t.projectId === project.id) ?? [];
  const open = pt.filter((t) => t.status !== "done").sort(compareTasks);
  const done = pt.filter((t) => t.status === "done");
  const selected = pt.find((t) => t.id === selectedTask);
  const records = activity?.filter((a) => a.projectId === project.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) ?? [];
  const pending = records.filter((a) => a.status === "awaiting_approval");
  const upcoming =
    now && events
      ? events.filter((e) => e.projectId === project.id && new Date(e.end) > now).sort((a, b) => a.start.localeCompare(b.start)).slice(0, 4)
      : [];
  const memories = memory?.filter((m) => m.projectId === project.id) ?? [];
  const conversations = [...new Set(records.filter((r) => r.origin.kind === "conversation").map((r) => r.origin.label))];
  const color = (calId: string) => calendars?.find((c) => c.id === calId)?.color ?? "slate";

  const ask = () => {
    const convId = startConversation({
      text: `Give me a status update on ${project.name}: what's done, what's next and what's at risk.`,
      context: [{ kind: "project", id: project.id, label: project.name }],
    });
    router.push(`/assistant/${convId}`);
  };

  return (
    <Page>
      <PageHeader
        title={project.name}
        crumbs={[{ label: "Projects", href: "/projects" }]}
        actions={
          <>
            <StatusMenu project={project} />
            <Button size="sm" icon={<Sparkles />} onClick={ask}>
              <span className="max-sm:sr-only">Ask LANA</span>
            </Button>
          </>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1100px] px-4 pb-16 pt-6 md:px-6">
          <div className="flex items-start gap-4">
            <ProjectTile project={project} size={44} />
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold tracking-tight text-fg">{project.name}</h1>
              <p className="mt-1 max-w-[70ch] text-sm leading-6 text-fg-muted">{project.description}</p>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line-subtle sm:grid-cols-4">
            <Stat label="Open tasks" value={open.length} />
            <Stat label="Completed" value={`${done.length}/${pt.length}`}>
              <ProgressBar done={done.length} total={pt.length} className="mt-2" />
            </Stat>
            <Stat label="Waiting on you" value={pending.length} tone={pending.length ? "warning" : undefined} href={pending.length ? "/activity/approvals" : undefined} />
            <Stat label="Updated" value={formatRelative(project.updatedAt)} small />
          </dl>

          <div className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex min-w-0 flex-col gap-4">
              <Panel title="Tasks" href="/tasks" hrefLabel="All tasks" meta={<span className="text-xs text-fg-faint">{open.length} open</span>}>
                <div className="p-2">
                  <QuickAdd projects={projects} defaultProjectId={project.id} />
                </div>
                {!tasks || !now ? (
                  <Skeleton className="m-3 h-20" />
                ) : open.length === 0 ? (
                  <p className="px-4 pb-4 text-sm text-fg-subtle">No open tasks. Add one above.</p>
                ) : (
                  <ul className="border-t border-line-subtle">
                    {open.map((t) => (
                      <TaskRow
                        key={t.id}
                        task={t}
                        selected={selectedTask === t.id}
                        onSelect={() => setSelectedTask(selectedTask === t.id ? null : t.id)}
                        now={now}
                        showProject={false}
                      />
                    ))}
                  </ul>
                )}
                {done.length > 0 && now && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowDone((s) => !s)}
                      aria-expanded={showDone}
                      className="flex h-9 w-full items-center gap-1.5 px-4 text-xs text-fg-subtle hover:text-fg"
                    >
                      <ChevronDown className={cn("size-3.5 transition-transform", showDone && "rotate-180")} />
                      {done.length} completed
                    </button>
                    {showDone && (
                      <ul className="border-t border-line-subtle">
                        {done.map((t) => (
                          <TaskRow key={t.id} task={t} selected={selectedTask === t.id} onSelect={() => setSelectedTask(t.id)} now={now} showProject={false} />
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </Panel>

              <NotesPanel key={project.id} project={project} />

              <Panel title="Activity" href="/activity">
                {records.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-fg-subtle">LANA hasn&apos;t taken any actions for this project yet.</p>
                ) : (
                  <ul className="py-1">
                    {records.slice(0, 6).map((a) => (
                      <li key={a.id} className="flex items-center gap-3 px-3.5 py-2">
                        <IntegrationLogo id={a.integrationId} size={22} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-fg">{a.title}</span>
                          <span className="block truncate text-xs text-fg-subtle">{formatRelative(a.finishedAt ?? a.createdAt)}</span>
                        </span>
                        <StatusBadge status={a.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              <Panel title="Key dates">
                {project.milestones.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-fg-subtle">No milestones yet.</p>
                ) : (
                  <ol className="px-4 py-3">
                    {[...project.milestones]
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((m, i, arr) => {
                        const diff = now ? dayDiff(m.date, now) : 0;
                        return (
                          <li key={m.id} className="relative flex gap-3 pb-3 last:pb-0">
                            {i < arr.length - 1 && <span aria-hidden className="absolute left-[7px] top-4 h-full w-px bg-line" />}
                            <span
                              className={cn(
                                "relative mt-0.5 grid size-[15px] shrink-0 place-items-center rounded-full border",
                                m.done ? "border-transparent bg-raised text-fg-muted ring-1 ring-line-strong" : "border-line-strong bg-panel",
                              )}
                            >
                              {m.done && <Check className="size-2.5" strokeWidth={3} />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className={cn("block text-sm", m.done ? "text-fg-subtle" : "text-fg")}>{m.label}</span>
                              <span className={cn("block text-xs", !m.done && diff >= 0 && diff <= 3 ? "text-warning" : "text-fg-subtle")}>
                                {formatShortDate(m.date)}
                                {!m.done && now && diff >= 0 && ` · ${diff === 0 ? "today" : `in ${diff} day${diff === 1 ? "" : "s"}`}`}
                              </span>
                            </span>
                          </li>
                        );
                      })}
                  </ol>
                )}
              </Panel>

              <Panel title="Upcoming" href="/calendar" hrefLabel="Calendar">
                {upcoming.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-fg-subtle">No upcoming events.</p>
                ) : (
                  <ul className="py-1">
                    {upcoming.map((e) => (
                      <li key={e.id} className="flex items-center gap-2.5 px-3.5 py-1.5">
                        <span aria-hidden className={cn("h-7 w-[3px] shrink-0 rounded-full", CATEGORY_BG[color(e.calendarId)])} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-fg">{e.title}</span>
                          <span className="block text-xs text-fg-subtle">
                            {formatDay(e.start)}
                            {!e.allDay && `, ${formatTime(e.start)}`}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel title="Connected apps" href="/integrations" hrefLabel="Manage">
                <ul className="py-1">
                  {project.integrations.length === 0 && <li className="px-4 py-3 text-sm text-fg-subtle">None yet.</li>}
                  {project.integrations.map((id) => {
                    const c = connections?.find((x) => x.integrationId === id);
                    return (
                      <li key={id} className="flex items-center gap-2.5 px-3.5 py-1.5 text-sm">
                        <IntegrationLogo id={id} size={20} />
                        <span className="flex-1 text-fg">{integrationName(id)}</span>
                        <span className={cn("text-xs", c?.status === "connected" ? "text-fg-subtle" : c ? "text-warning" : "text-fg-faint")}>
                          {c?.status === "connected" ? "Connected" : c ? "Needs reconnect" : "Not connected"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Panel>

              <Panel title="What LANA remembers" href="/memory" hrefLabel="Memory">
                {memories.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-fg-subtle">Nothing yet. LANA learns from conversations about this project.</p>
                ) : (
                  <ul className="flex flex-col gap-2.5 px-4 py-3">
                    {memories.map((m) => (
                      <li key={m.id} className="flex gap-2.5">
                        <Brain className="mt-0.5 size-3.5 shrink-0 text-fg-subtle" />
                        <span className="text-sm text-fg">{m.title}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              {conversations.length > 0 && (
                <Panel title="Related conversations" href="/assistant" hrefLabel="Assistant">
                  <ul className="py-1">
                    {conversations.map((c) => (
                      <li key={c} className="flex items-center gap-2.5 px-3.5 py-1.5 text-sm text-fg">
                        <MessageSquare className="size-3.5 text-fg-subtle" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}
            </div>
          </div>
        </div>
      </div>
      {selected && (
        <Sheet open onOpenChange={(o) => !o && setSelectedTask(null)} title="Task">
          <TaskDetail task={selected} projects={projects} onClose={() => setSelectedTask(null)} />
        </Sheet>
      )}
    </Page>
  );
}

function Stat({
  label,
  value,
  tone,
  href,
  small,
  children,
}: {
  label: string;
  value: ReactNode;
  tone?: "warning";
  href?: string;
  small?: boolean;
  children?: ReactNode;
}) {
  const body = (
    <>
      <dt className="text-xs text-fg-subtle">{label}</dt>
      <dd className={cn("mt-1 font-semibold tabular-nums", small ? "text-sm leading-7" : "text-xl", tone === "warning" ? "text-warning" : "text-fg")}>{value}</dd>
      {children}
    </>
  );
  return href ? (
    <Link href={href} className="block bg-panel px-4 py-3 transition-colors hover:bg-raised">
      {body}
    </Link>
  ) : (
    <div className="bg-panel px-4 py-3">{body}</div>
  );
}

function StatusMenu({ project }: { project: Project }) {
  return (
    <Menu>
      <MenuTrigger asChild>
        <button type="button" aria-label="Change project status" className="flex h-7 items-center gap-1 rounded-md px-1 hover:bg-hover data-[state=open]:bg-hover">
          <ProjectStatusBadge status={project.status} />
          <ChevronDown className="size-3.5 text-fg-faint" />
        </button>
      </MenuTrigger>
      <MenuContent align="end">
        <MenuRadioGroup
          value={project.status}
          onValueChange={(v) => {
            updateProject(project.id, { status: v as ProjectStatus });
            toast({ title: `Marked as ${PROJECT_STATUS[v as ProjectStatus].label.toLowerCase()}` });
          }}
        >
          {Object.entries(PROJECT_STATUS).map(([v, s]) => (
            <MenuRadioItem key={v} value={v}>
              {s.label}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}

function NotesPanel({ project }: { project: Project }) {
  const [value, setValue] = useState(project.notes ?? "");
  const dirty = value !== (project.notes ?? "");
  return (
    <Panel title="Notes" meta={dirty ? <span className="text-xs text-fg-faint">Unsaved</span> : undefined}>
      <div className="p-3">
        <Textarea
          aria-label="Project notes"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={5}
          placeholder="Decisions, context and anything LANA should know about this project…"
          className="border-transparent bg-transparent px-1 hover:border-transparent focus:border-line"
        />
        {dirty && (
          <div className="mt-2 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setValue(project.notes ?? "")}>
              Discard
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                updateProject(project.id, { notes: value });
                toast({ title: "Notes saved", tone: "success" });
              }}
            >
              Save notes
            </Button>
          </div>
        )}
      </div>
    </Panel>
  );
}

function DetailSkeleton() {
  return (
    <Page>
      <div className="flex h-12 items-center border-b border-line-subtle px-5">
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="mx-auto w-full max-w-[1100px] px-6 pt-6" role="status" aria-label="Loading project">
        <Skeleton className="h-11 w-80" />
        <Skeleton className="mt-5 h-20" />
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    </Page>
  );
}
