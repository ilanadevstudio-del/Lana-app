"use client";

import { useState } from "react";
import { Brain, Briefcase, Heart, MessageSquare, MoreHorizontal, Pause, Pencil, Pin, PinOff, Plus, Search, SearchX, Settings2, Trash2, User, Users, FolderKanban, Handshake, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { IntegrationLogo } from "@/components/lana/integration-logo";
import { ProjectChip } from "@/components/lana/project-chip";
import { Page, PageHeader } from "@/components/shell/page";
import { Button, IconButton, buttonStyles } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Switch } from "@/components/ui/controls";
import { EmptyState, ListSkeleton } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { toast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { deleteMemory, MEMORY_CATEGORIES, restoreMemory, setMemoryEnabled, updateMemory, useMemory, useMemorySettings } from "@/lib/data/memory";
import type { MemoryCategory, MemoryItem, Project } from "@/lib/data/types";
import { useProjects } from "@/lib/data/workspace";
import { formatRelative } from "@/lib/format";
import { MemoryEditor } from "./memory-editor";

const ICONS: Record<MemoryCategory, LucideIcon> = {
  personal: User,
  people: Users,
  projects: FolderKanban,
  preferences: Heart,
  commitments: Handshake,
  work: Briefcase,
};

export function MemoryView() {
  const memory = useMemory();
  const settings = useMemorySettings();
  const projects = useProjects();
  const [category, setCategory] = useState<"all" | MemoryCategory>("all");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<{ item?: MemoryItem; category?: MemoryCategory } | null>(null);
  const [deleting, setDeleting] = useState<MemoryItem | null>(null);

  const q = query.trim().toLowerCase();
  const matches = memory?.filter((m) => !q || m.title.toLowerCase().includes(q) || m.detail.toLowerCase().includes(q) || m.source?.label.toLowerCase().includes(q));
  const inCategory = matches?.filter((m) => category === "all" || m.category === category);
  const sorted = inCategory?.sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
  const count = (c: MemoryCategory) => matches?.filter((m) => m.category === c).length ?? 0;

  return (
    <Page>
      <PageHeader
        title="Memory"
        meta={memory && <span className="text-xs text-fg-subtle">{memory.length} items</span>}
        actions={
          <>
            <Input icon={<Search />} size="sm" placeholder="Search memory" aria-label="Search memory" value={query} onChange={(e) => setQuery(e.target.value)} className="hidden w-52 sm:flex" />
            <Button variant="primary" size="sm" icon={<Plus />} onClick={() => setEditor({ category: category === "all" ? undefined : category })}>
              <span className="max-sm:sr-only">Add memory</span>
            </Button>
          </>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Categories */}
        <nav aria-label="Memory categories" className="shrink-0 border-b border-line-subtle md:w-60 md:border-b-0 md:border-r">
          <ul className="flex gap-1 overflow-x-auto px-3 py-2 md:flex-col md:gap-px md:px-2 md:py-3">
            <CategoryButton active={category === "all"} onClick={() => setCategory("all")} icon={Brain} label="Everything" count={matches?.length ?? 0} />
            {MEMORY_CATEGORIES.map((c) => (
              <CategoryButton key={c.id} active={category === c.id} onClick={() => setCategory(c.id)} icon={ICONS[c.id]} label={c.label} count={count(c.id)} description={c.description} />
            ))}
          </ul>
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[820px] px-4 pb-16 pt-4 md:px-6">
            {settings && (
              <div
                className={cn(
                  "mb-4 flex flex-wrap items-center gap-3 rounded-lg border px-3.5 py-3",
                  settings.enabled ? "border-line bg-panel" : "border-warning/25 bg-warning-soft",
                )}
              >
                {settings.enabled ? <Brain className="size-4 text-fg-subtle" /> : <Pause className="size-4 text-warning" />}
                <p className="min-w-[16rem] flex-1 text-sm text-fg-muted">
                  {settings.enabled ? (
                    <>
                      <span className="font-medium text-fg">Memory is on.</span> LANA uses these to personalise answers and actions. Everything here is visible, editable and deletable.
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-fg">Memory is paused.</span> LANA won&apos;t use or add memories until you turn it back on.
                    </>
                  )}
                </p>
                <Link href="/settings/memory" className={buttonStyles({ variant: "ghost", size: "sm" })}>
                  <Settings2 /> Settings
                </Link>
                <label className="flex items-center gap-2 text-xs text-fg-muted">
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(v) => {
                      setMemoryEnabled(v);
                      toast({ title: v ? "Memory turned on" : "Memory paused" });
                    }}
                    label="Use memory"
                  />
                  Use memory
                </label>
              </div>
            )}

            <Input icon={<Search />} size="md" placeholder="Search memory" aria-label="Search memory" value={query} onChange={(e) => setQuery(e.target.value)} className="mb-4 sm:hidden" />

            {!sorted || !projects ? (
              <ListSkeleton rows={6} />
            ) : sorted.length === 0 ? (
              q ? (
                <EmptyState icon={<SearchX />} title="Nothing matches your search" action={<Button size="sm" onClick={() => setQuery("")}>Clear search</Button>} />
              ) : (
                <EmptyState
                  icon={<Brain />}
                  title="Nothing remembered here yet"
                  description="LANA adds memories as you work together. You can also add them yourself."
                  action={
                    <Button size="sm" icon={<Plus />} onClick={() => setEditor({ category: category === "all" ? undefined : category })}>
                      Add memory
                    </Button>
                  }
                />
              )
            ) : (
              <ul className="overflow-hidden rounded-lg border border-line bg-panel">
                {sorted.map((m) => (
                  <MemoryRow key={m.id} item={m} project={projects.find((p) => p.id === m.projectId)} showCategory={category === "all"} onEdit={() => setEditor({ item: m })} onDelete={() => setDeleting(m)} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <MemoryEditor state={editor} onClose={() => setEditor(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this memory?"
        description={deleting ? `LANA will forget “${deleting.title}”. This can't be undone after you leave this page.` : undefined}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (!deleting) return;
          const removed = deleteMemory(deleting.id);
          if (removed) toast({ title: "Memory deleted", action: { label: "Undo", onClick: () => restoreMemory(removed) } });
        }}
      />
    </Page>
  );
}

function CategoryButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  count: number;
  description?: string;
}) {
  return (
    <li className="shrink-0">
      <button
        type="button"
        onClick={onClick}
        aria-current={active || undefined}
        title={description}
        className={cn(
          "flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors",
          active ? "bg-pressed font-medium text-fg" : "text-fg-muted hover:bg-hover hover:text-fg",
        )}
      >
        <Icon className={cn("size-4 shrink-0", active ? "text-fg" : "text-fg-subtle")} />
        <span className="flex-1 whitespace-nowrap text-left">{label}</span>
        <span className="text-xs tabular-nums text-fg-faint">{count}</span>
      </button>
    </li>
  );
}

function MemoryRow({
  item,
  project,
  showCategory,
  onEdit,
  onDelete,
}: {
  item: MemoryItem;
  project?: Project;
  showCategory: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = ICONS[item.category];
  const category = MEMORY_CATEGORIES.find((c) => c.id === item.category)!;
  return (
    <li className="group flex gap-3 border-b border-line-subtle px-4 py-3.5 last:border-0">
      <Icon className="mt-0.5 size-4 shrink-0 text-fg-subtle" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-medium text-fg">
          {item.title}
          {item.pinned && <Pin className="size-3 shrink-0 fill-current text-fg-subtle" aria-label="Pinned" />}
        </p>
        {item.detail && <p className="mt-0.5 text-sm leading-6 text-fg-muted">{item.detail}</p>}
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-subtle">
          {showCategory && <span>{category.label}</span>}
          {item.source && (
            <span className="flex items-center gap-1.5" title="Where LANA learned this">
              {item.source.integrationId ? (
                <IntegrationLogo id={item.source.integrationId} size={12} bare />
              ) : item.source.kind === "conversation" ? (
                <MessageSquare className="size-3" />
              ) : (
                <User className="size-3" />
              )}
              {item.source.label}
            </span>
          )}
          {project && <ProjectChip project={project} link />}
          <span>Updated {formatRelative(item.updatedAt)}</span>
        </p>
      </div>
      <div className="flex shrink-0 items-start gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100">
        <Tooltip content={item.pinned ? "Unpin" : "Pin"}>
          <IconButton label={item.pinned ? "Unpin" : "Pin"} size="sm" onClick={() => updateMemory(item.id, { pinned: !item.pinned })}>
            {item.pinned ? <PinOff /> : <Pin />}
          </IconButton>
        </Tooltip>
        <Menu>
          <MenuTrigger asChild>
            <IconButton label={`Options for ${item.title}`} size="sm">
              <MoreHorizontal />
            </IconButton>
          </MenuTrigger>
          <MenuContent align="end" className="min-w-40">
            <MenuItem icon={<Pencil />} onSelect={onEdit}>
              Edit
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={<Trash2 />} danger onSelect={onDelete}>
              Delete
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>
    </li>
  );
}
