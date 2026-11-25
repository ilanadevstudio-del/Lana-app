"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderKanban, Plus } from "lucide-react";
import { IntegrationLogo } from "@/components/lana/integration-logo";
import { ProjectTile } from "@/components/lana/project-chip";
import { Page, PageHeader, PageToolbar } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/controls";
import { EmptyState, ListSkeleton } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Dialog } from "@/components/ui/overlays";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { useTasks } from "@/lib/data/tasks";
import type { CategoryColor, ProjectStatus } from "@/lib/data/types";
import { createProject, useProjects } from "@/lib/data/workspace";
import { formatRelative, formatShortDate } from "@/lib/format";
import { CATEGORY_BG } from "@/components/lana/category";
import { PROJECT_STATUS, ProgressBar, ProjectStatusBadge } from "./project-status";

type Filter = "current" | "completed" | "all";

export function ProjectsView() {
  const projects = useProjects();
  const tasks = useTasks();
  const [filter, setFilter] = useState<Filter>("current");
  const [creating, setCreating] = useState(false);

  const list = projects
    ?.filter((p) => (filter === "all" ? true : filter === "completed" ? p.status === "completed" : p.status !== "completed"))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <Page>
      <PageHeader
        title="Projects"
        actions={
          <Button variant="primary" size="sm" icon={<Plus />} onClick={() => setCreating(true)}>
            <span className="max-sm:sr-only">New project</span>
          </Button>
        }
      />
      <PageToolbar>
        <Segmented
          label="Project filter"
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "current", label: "Current" },
            { value: "completed", label: "Completed" },
            { value: "all", label: "All" },
          ]}
        />
      </PageToolbar>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {!list || !tasks ? (
          <div className="px-5 pt-3">
            <ListSkeleton rows={5} />
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<FolderKanban />}
            title={filter === "completed" ? "No completed projects yet" : "No projects yet"}
            description="Projects give LANA context: related tasks, dates, notes and conversations live together."
            action={
              <Button variant="primary" size="sm" icon={<Plus />} onClick={() => setCreating(true)}>
                New project
              </Button>
            }
          />
        ) : (
          <div className="pb-16">
            <div
              aria-hidden
              className="hidden h-8 grid-cols-[minmax(0,1fr)_110px_150px_170px_130px] items-center gap-6 border-b border-line-subtle px-5 text-2xs font-medium text-fg-subtle lg:grid"
            >
              <span>Project</span>
              <span>Status</span>
              <span>Progress</span>
              <span>Next date</span>
              <span className="text-right">Updated</span>
            </div>
            <ul aria-label="Projects">
              {list.map((p) => {
                const pt = tasks.filter((t) => t.projectId === p.id);
                const done = pt.filter((t) => t.status === "done").length;
                const next = p.milestones.filter((m) => !m.done).sort((a, b) => a.date.localeCompare(b.date))[0];
                return (
                  <li key={p.id}>
                    <Link
                      href={`/projects/${p.id}`}

                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-2 border-b border-line-subtle px-4 py-3 transition-colors hover:bg-hover lg:grid-cols-[minmax(0,1fr)_110px_150px_170px_130px] lg:px-5"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <ProjectTile project={p} size={32} />
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-fg">{p.name}</span>
                            <span className="hidden shrink-0 items-center gap-1 sm:flex">
                              {p.integrations.slice(0, 4).map((id) => (
                                <IntegrationLogo key={id} id={id} size={12} bare className="opacity-70" />
                              ))}
                            </span>
                          </span>
                          <span className="block truncate text-xs text-fg-subtle">{p.description}</span>
                        </span>
                      </span>
                      <span>
                        <ProjectStatusBadge status={p.status} />
                      </span>
                      <span className="col-span-2 flex items-center gap-2.5 lg:col-span-1">
                        <ProgressBar done={done} total={pt.length} className="w-20 lg:flex-1" />
                        <span className="text-xs tabular-nums text-fg-subtle">
                          {done}/{pt.length}
                        </span>
                      </span>
                      <span className="hidden min-w-0 lg:block">
                        {next ? (
                          <>
                            <span className="block truncate text-xs text-fg">{next.label}</span>
                            <span className="block text-2xs text-fg-subtle">{formatShortDate(next.date)}</span>
                          </>
                        ) : (
                          <span className="text-xs text-fg-faint">—</span>
                        )}
                      </span>
                      <span className="hidden whitespace-nowrap text-right text-xs text-fg-subtle lg:block">
                        {formatRelative(p.updatedAt)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      <NewProjectDialog open={creating} onClose={() => setCreating(false)} />
    </Page>
  );
}

const COLORS: CategoryColor[] = ["blue", "violet", "green", "amber", "rose", "teal", "slate"];

function NewProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [color, setColor] = useState<CategoryColor>("blue");
  const [submitted, setSubmitted] = useState(false);
  const error = submitted && !name.trim() ? "Give the project a name." : undefined;

  function create() {
    setSubmitted(true);
    if (!name.trim()) return;
    const p = createProject({ name: name.trim(), description: description.trim(), status, color });
    toast({ title: "Project created", description: p.name, tone: "success" });
    setName("");
    setDescription("");
    setSubmitted(false);
    onClose();
    router.push(`/projects/${p.id}`);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="New project"
      description="LANA will use this to group related tasks, events, notes and conversations."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={create}>
            Create project
          </Button>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          create();
        }}
        className="flex flex-col gap-4 pb-2"
      >
        <Field label="Name" error={error}>
          {(p) => <Input {...p} autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q1 fundraising" />}
        </Field>
        <Field label="Description" optional>
          {(p) => (
            <Textarea
              {...p}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this project about?"
            />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status">
            {(p) => (
              <Select {...p} value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
                {Object.entries(PROJECT_STATUS).map(([v, s]) => (
                  <option key={v} value={v}>
                    {s.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <fieldset>
            <legend className="mb-1.5 text-xs font-medium text-fg-muted">Colour</legend>
            <div className="flex h-8 items-center gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  aria-pressed={color === c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-5 rounded-md ring-offset-2 ring-offset-overlay transition-shadow",
                    CATEGORY_BG[c],
                    color === c && "ring-2 ring-fg-muted",
                  )}
                />
              ))}
            </div>
          </fieldset>
        </div>
        <button type="submit" hidden />
      </form>
    </Dialog>
  );
}
