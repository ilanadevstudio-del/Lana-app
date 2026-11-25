"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { AlignLeft, ChevronDown, FileUp, Library as LibraryIcon, Link2, Plus, Search, SearchX, Upload } from "lucide-react";
import { Page, PageHeader, PageToolbar, SplitView } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, ListSkeleton } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { deleteLibraryItem, restoreLibraryItem, updateLibraryItem, useLibrary } from "@/lib/data/library";
import type { LibraryItem, LibraryItemKind } from "@/lib/data/types";
import { setUi, useUi } from "@/lib/ui-state";
import { useNow } from "@/lib/use-now";
import { LibraryItemDialog } from "./library-item-dialog";
import { LibraryRow } from "./library-row";

type KindFilter = "all" | LibraryItemKind;

/** What the add/edit dialog is doing. Shared with LibraryItemDialog. */
export type LibraryDialogState =
  | { mode: "add"; kind: LibraryItemKind; file?: File }
  | { mode: "edit"; item: LibraryItem; replaceFile?: boolean }
  | null;

const FILTERS: { value: KindFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "file", label: "Files" },
  { value: "link", label: "Links" },
  { value: "text", label: "Text" },
];

function matches(item: LibraryItem, q: string) {
  return [item.name, ...item.aliases, item.file?.fileName, item.link?.url, item.text?.body, item.description]
    .filter(Boolean)
    .some((s) => s!.toLowerCase().includes(q));
}

export function LibraryView() {
  const items = useLibrary();
  const now = useNow();
  const [filter, setFilter] = useState<KindFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<LibraryDialogState>(null);
  const [deleting, setDeleting] = useState<LibraryItem | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  // Opening a specific item from the command menu.
  const openId = useUi((s) => s.openLibraryItemId);
  useEffect(() => {
    if (openId) {
      setUi({ openLibraryItemId: null });
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot handoff from the command menu
      setSelectedId(openId);
    }
  }, [openId]);

  const q = query.trim().toLowerCase();
  const searched = useMemo(() => items?.filter((i) => !q || matches(i, q)) ?? null, [items, q]);
  const shown = useMemo(
    () =>
      searched
        ?.filter((i) => filter === "all" || i.kind === filter)
        .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.updatedAt.localeCompare(a.updatedAt)) ?? null,
    [searched, filter],
  );
  const count = (k: KindFilter) => (k === "all" ? searched?.length : searched?.filter((i) => i.kind === k).length) ?? 0;

  async function copy(item: LibraryItem) {
    const value = item.link?.url ?? item.text?.body ?? "";
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: item.kind === "link" ? "Link copied" : "Text copied", tone: "success" });
    } catch {
      toast({ title: "Couldn't copy", description: "Your browser blocked clipboard access.", tone: "danger" });
    }
  }

  function remove(item: LibraryItem) {
    const removed = deleteLibraryItem(item.id);
    if (selectedId === item.id) setSelectedId(null);
    if (removed) toast({ title: "Removed from Library", description: removed.name, action: { label: "Undo", onClick: () => restoreLibraryItem(removed) } });
  }

  const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer.types).includes("Files");

  return (
    <Page>
      <div
        className="relative flex min-h-0 flex-1 flex-col"
        onDragEnter={(e) => {
          if (!hasFiles(e)) return;
          dragDepth.current++;
          setDragging(true);
        }}
        onDragOver={(e) => hasFiles(e) && e.preventDefault()}
        onDragLeave={(e) => {
          if (!hasFiles(e)) return;
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setDragging(false);
        }}
        onDrop={(e) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          dragDepth.current = 0;
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) setDialog({ mode: "add", kind: "file", file });
        }}
      >
        <PageHeader
          title="Library"
          meta={items && <span className="text-xs text-fg-subtle">{items.length} items</span>}
          actions={
            <>
              <Input
                icon={<Search />}
                size="sm"
                placeholder="Search library"
                aria-label="Search library"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="hidden w-52 sm:flex"
              />
              <AddMenu onAdd={(kind) => setDialog({ mode: "add", kind })} />
            </>
          }
        />
        <PageToolbar>
          <nav aria-label="Filter by kind" className="flex gap-0.5">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                aria-current={filter === f.value || undefined}
                className={cn(
                  "flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                  filter === f.value ? "bg-pressed text-fg" : "text-fg-subtle hover:bg-hover hover:text-fg",
                )}
              >
                {f.label}
                <span className="tabular-nums text-fg-subtle">{count(f.value)}</span>
              </button>
            ))}
          </nav>
        </PageToolbar>

        <SplitView asideTitle="Item" onAsideClose={() => setSelectedId(null)}>
          <div className="px-4 pt-3 sm:hidden">
            <Input icon={<Search />} placeholder="Search library" aria-label="Search library" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {!shown || !now ? (
            <div className="px-5 pt-3">
              <ListSkeleton rows={6} />
            </div>
          ) : items!.length === 0 ? (
            <EmptyState
              icon={<LibraryIcon />}
              title="Your Library is empty"
              description="Add your CV, a headshot or a bio, then ask LANA to send it."
              action={
                <Button variant="primary" size="sm" icon={<Upload />} onClick={() => setDialog({ mode: "add", kind: "file" })}>
                  Upload a file
                </Button>
              }
            />
          ) : shown.length === 0 ? (
            <EmptyState
              icon={<SearchX />}
              title="Nothing matches"
              action={
                <Button
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setFilter("all");
                  }}
                >
                  Clear search
                </Button>
              }
            />
          ) : (
            <ul aria-label="Library items" className="pb-16">
              {shown.map((item) => (
                <LibraryRow
                  key={item.id}
                  item={item}
                  now={now}
                  selected={selectedId === item.id}
                  actions={{
                    onSelect: () => setSelectedId(selectedId === item.id ? null : item.id),
                    onRename: () => setDialog({ mode: "edit", item }),
                    onReplace: () => setDialog({ mode: "edit", item, replaceFile: true }),
                    onCopy: () => copy(item),
                    onTogglePin: () => updateLibraryItem(item.id, { pinned: !item.pinned }),
                    onDelete: () => setDeleting(item),
                  }}
                />
              ))}
            </ul>
          )}
        </SplitView>

        {dragging && (
          <div aria-hidden className="pointer-events-none absolute inset-2 z-20 grid place-items-center rounded-xl border-2 border-dashed border-accent-line bg-canvas/85">
            <div className="flex flex-col items-center gap-2 text-sm text-fg">
              <FileUp className="size-6 text-accent-text" />
              Drop to add to Library
            </div>
          </div>
        )}
      </div>

      <LibraryItemDialog state={dialog} onClose={() => setDialog(null)} onSaved={setSelectedId} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Remove “${deleting?.name ?? ""}”?`}
        description="LANA won't be able to share it any more. Its share history goes with it."
        confirmLabel="Remove"
        destructive
        onConfirm={() => deleting && remove(deleting)}
      />
    </Page>
  );
}

function AddMenu({ onAdd }: { onAdd: (kind: LibraryItemKind) => void }) {
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="primary" size="sm" icon={<Plus />} trailing={<ChevronDown className="opacity-70" />}>
          <span className="max-sm:sr-only">Add</span>
        </Button>
      </MenuTrigger>
      <MenuContent align="end" className="min-w-44">
        <MenuItem icon={<Upload />} onSelect={() => onAdd("file")}>
          Upload file
        </MenuItem>
        <MenuItem icon={<Link2 />} onSelect={() => onAdd("link")}>
          Add link
        </MenuItem>
        <MenuItem icon={<AlignLeft />} onSelect={() => onAdd("text")}>
          Add text
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
