"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Search, SquarePen, Trash2 } from "lucide-react";
import { buttonStyles, IconButton } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { Dialog } from "@/components/ui/overlays";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { deleteConversation, renameConversation, useConversations } from "@/lib/assistant/store";
import type { Conversation } from "@/lib/assistant/types";
import { cn } from "@/lib/cn";
import { dayDiff } from "@/lib/format";

function groupLabel(iso: string) {
  const d = dayDiff(iso);
  if (d === 0) return "Today";
  if (d === -1) return "Yesterday";
  if (d > -7) return "Previous 7 days";
  if (d > -30) return "Previous 30 days";
  return "Older";
}

/**
 * Conversation history with search, grouped by recency.
 * The active id comes from route params, which stream in after prerendering (see WithPathname).
 */
export function ConversationList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Suspense fallback={<List activeId={null} onNavigate={onNavigate} />}>
      <ListWithParams onNavigate={onNavigate} />
    </Suspense>
  );
}

function ListWithParams({ onNavigate }: { onNavigate?: () => void }) {
  const params = useParams<{ id?: string }>();
  return <List activeId={params.id ?? null} onNavigate={onNavigate} />;
}

function List({ activeId, onNavigate }: { activeId: string | null; onNavigate?: () => void }) {
  const conversations = useConversations();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [renaming, setRenaming] = useState<Conversation | null>(null);

  const groups = useMemo(() => {
    if (!conversations) return null;
    const q = query.trim().toLowerCase();
    const filtered = q
      ? conversations.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.messages.some((m) => m.parts.some((p) => p.type === "text" && p.text.toLowerCase().includes(q))),
        )
      : conversations;
    const out: { label: string; items: Conversation[] }[] = [];
    for (const c of filtered) {
      const label = groupLabel(c.updatedAt);
      const g = out.find((x) => x.label === label);
      if (g) g.items.push(c);
      else out.push({ label, items: [c] });
    }
    return out;
  }, [conversations, query]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 p-2">
        <Link href="/assistant" onClick={onNavigate} className={buttonStyles({ variant: "secondary", className: "w-full justify-start" })}>
          <SquarePen />
          New conversation
        </Link>
        <Input
          icon={<Search />}
          size="sm"
          placeholder="Search conversations"
          aria-label="Search conversations"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <nav aria-label="Conversation history" className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {!groups ? (
          <div className="flex flex-col gap-2 p-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-6" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-fg-subtle">{query ? "No conversations match." : "No conversations yet."}</p>
        ) : (
          groups.map((g) => (
            <div key={g.label} className="mt-2">
              <p className="px-2 pb-1 text-2xs font-medium text-fg-faint">{g.label}</p>
              <ul className="flex flex-col gap-px">
                {g.items.map((c) => {
                  const active = activeId === c.id;
                  return (
                    <li key={c.id} className="group/item relative">
                      <Link
                        href={`/assistant/${c.id}`}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex h-8 items-center gap-2 rounded-md pl-2 pr-8 text-sm transition-colors",
                          active ? "bg-pressed text-fg" : "text-fg-muted hover:bg-hover hover:text-fg",
                        )}
                      >
                        {c.busy && <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-accent" aria-label="Working" />}
                        {c.phase === "awaiting_approval" && <span className="size-1.5 shrink-0 rounded-full bg-warning" aria-label="Needs approval" />}
                        <span className="truncate">{c.title}</span>
                      </Link>
                      <Menu>
                        <MenuTrigger asChild>
                          <IconButton
                            label={`Options for ${c.title}`}
                            size="sm"
                            className="absolute right-0.5 top-0.5 opacity-0 focus-visible:opacity-100 group-hover/item:opacity-100 data-[state=open]:opacity-100 max-md:opacity-100"
                          >
                            <MoreHorizontal />
                          </IconButton>
                        </MenuTrigger>
                        <MenuContent align="end" className="min-w-40">
                          <MenuItem icon={<Pencil />} onSelect={() => setRenaming(c)}>
                            Rename
                          </MenuItem>
                          <MenuItem
                            icon={<Trash2 />}
                            danger
                            onSelect={() => {
                              deleteConversation(c.id);
                              toast({ title: "Conversation deleted" });
                              if (active) router.push("/assistant");
                            }}
                          >
                            Delete
                          </MenuItem>
                        </MenuContent>
                      </Menu>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </nav>
      <RenameDialog conversation={renaming} onClose={() => setRenaming(null)} />
    </div>
  );
}

function RenameDialog({ conversation, onClose }: { conversation: Conversation | null; onClose: () => void }) {
  const [title, setTitle] = useState("");
  return (
    <Dialog
      open={!!conversation}
      onOpenChange={(o) => !o && onClose()}
      title="Rename conversation"
      size="sm"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!title.trim()}
            onClick={() => {
              if (conversation) renameConversation(conversation.id, title.trim());
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (conversation && title.trim()) renameConversation(conversation.id, title.trim());
          onClose();
        }}
      >
        <Input
          key={conversation?.id}
          autoFocus
          aria-label="Conversation title"
          defaultValue={conversation?.title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={(e) => setTitle(e.target.value)}
        />
      </form>
    </Dialog>
  );
}
