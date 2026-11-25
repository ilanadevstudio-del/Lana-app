"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as RD from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { CalendarPlus, CircleCheck, Keyboard, MessageSquare, Moon, PanelLeft, Plus, Search, Sparkles, Sun } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { startConversation } from "@/lib/assistant/engine";
import { useConversations } from "@/lib/assistant/store";
import { useTasks } from "@/lib/data/tasks";
import { useProjects } from "@/lib/data/workspace";
import { setThemePreference } from "@/lib/use-theme";
import { setUi, toggleSidebar, useUi } from "@/lib/ui-state";
import { ALL_NAV } from "./nav";

export function CommandPalette() {
  const open = useUi((s) => s.paletteOpen);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const tasks = useTasks();
  const projects = useProjects();
  const conversations = useConversations();

  const close = () => {
    setUi({ paletteOpen: false });
    setQuery("");
  };
  const run = (fn: () => void) => {
    close();
    fn();
  };

  return (
    <RD.Root open={open} onOpenChange={(o) => (o ? setUi({ paletteOpen: true }) : close())}>
      <RD.Portal>
        <RD.Overlay className="scrim-motion fixed inset-0 z-50 bg-(--scrim)" />
        <RD.Content
          aria-describedby={undefined}
          className="dialog-motion fixed left-1/2 top-[12dvh] z-50 w-[min(640px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-xl border border-line bg-overlay shadow-dialog focus:outline-none"
        >
          <RD.Title className="sr-only">Command menu</RD.Title>
          <Command
            label="Command menu"
            loop
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-fg-subtle"
          >
            <div className="flex h-12 items-center gap-2.5 border-b border-line-subtle px-4">
              <Search className="size-4 shrink-0 text-fg-subtle" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search, jump to, or ask LANA…"
                className="h-full flex-1 bg-transparent text-[15px] text-fg placeholder:text-fg-faint focus:outline-none"
              />
              <Kbd>Esc</Kbd>
            </div>
            <Command.List className="max-h-[min(420px,60dvh)] overflow-y-auto p-1.5">
              <Command.Empty className="px-3 py-8 text-center text-sm text-fg-subtle">
                No matches. Press Enter to ask LANA.
              </Command.Empty>

              {query.trim() && (
                <Command.Group heading="Assistant" forceMount>
                  <Item
                    value={`ask-lana ${query}`}
                    forceMount
                    icon={<Sparkles className="text-accent-text!" />}
                    onSelect={() =>
                      run(() => {
                        const id = startConversation({ text: query.trim() });
                        router.push(`/assistant/${id}`);
                      })
                    }
                    hint="Ask"
                  >
                    Ask LANA: <span className="text-fg">“{query.trim()}”</span>
                  </Item>
                </Command.Group>
              )}

              <Command.Group heading="Actions">
                <Item icon={<MessageSquare />} onSelect={() => run(() => router.push("/assistant"))} shortcut={["N"]}>
                  New conversation
                </Item>
                <Item
                  icon={<Plus />}
                  onSelect={() =>
                    run(() => {
                      setUi({ quickAddRequested: true });
                      router.push("/tasks");
                    })
                  }
                >
                  New task
                </Item>
                <Item
                  icon={<CalendarPlus />}
                  onSelect={() =>
                    run(() => {
                      setUi({ newEventRequested: true });
                      router.push("/calendar");
                    })
                  }
                >
                  New event
                </Item>
                <Item icon={<PanelLeft />} onSelect={() => run(toggleSidebar)} shortcut={["["]}>
                  Toggle sidebar
                </Item>
                <Item icon={<Moon />} onSelect={() => run(() => setThemePreference("dark"))} keywords={["theme", "appearance"]}>
                  Switch to dark theme
                </Item>
                <Item icon={<Sun />} onSelect={() => run(() => setThemePreference("light"))} keywords={["theme", "appearance"]}>
                  Switch to light theme
                </Item>
                <Item icon={<Keyboard />} onSelect={() => run(() => setUi({ shortcutsOpen: true }))} shortcut={["?"]}>
                  Keyboard shortcuts
                </Item>
              </Command.Group>

              <Command.Group heading="Go to">
                {ALL_NAV.map((n) => {
                  const Icon = n.icon;
                  return (
                    <Item
                      key={n.href}
                      icon={<Icon />}
                      onSelect={() => run(() => router.push(n.href))}
                      shortcut={["G", n.key.toUpperCase()]}
                    >
                      {n.label}
                    </Item>
                  );
                })}
              </Command.Group>

              {query.trim() && (
                <>
                  {projects && projects.length > 0 && (
                    <Command.Group heading="Projects">
                      {projects.map((p) => (
                        <Item
                          key={p.id}
                          value={`project ${p.name}`}
                          icon={<span className="text-2xs font-semibold text-fg-subtle">{p.key}</span>}
                          onSelect={() => run(() => router.push(`/projects/${p.id}`))}
                        >
                          {p.name}
                        </Item>
                      ))}
                    </Command.Group>
                  )}
                  {tasks && (
                    <Command.Group heading="Tasks">
                      {tasks
                        .filter((t) => t.status !== "done")
                        .slice(0, 30)
                        .map((t) => (
                          <Item
                            key={t.id}
                            value={`task ${t.title}`}
                            icon={<CircleCheck />}
                            onSelect={() =>
                              run(() => {
                                setUi({ openTaskId: t.id });
                                router.push("/tasks");
                              })
                            }
                          >
                            {t.title}
                          </Item>
                        ))}
                    </Command.Group>
                  )}
                  {conversations && (
                    <Command.Group heading="Conversations">
                      {conversations.slice(0, 20).map((c) => (
                        <Item
                          key={c.id}
                          value={`conversation ${c.title}`}
                          icon={<MessageSquare />}
                          onSelect={() => run(() => router.push(`/assistant/${c.id}`))}
                        >
                          {c.title}
                        </Item>
                      ))}
                    </Command.Group>
                  )}
                </>
              )}
            </Command.List>
            <div className="flex h-9 items-center gap-4 border-t border-line-subtle px-4 text-2xs text-fg-subtle">
              <span className="flex items-center gap-1.5">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> Navigate
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>↵</Kbd> Select
              </span>
            </div>
          </Command>
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}

function Item({
  children,
  icon,
  onSelect,
  shortcut,
  value,
  keywords,
  hint,
  forceMount,
}: {
  children: ReactNode;
  icon?: ReactNode;
  onSelect: () => void;
  shortcut?: string[];
  value?: string;
  keywords?: string[];
  hint?: string;
  forceMount?: boolean;
}) {
  return (
    <Command.Item
      value={value}
      keywords={keywords}
      onSelect={onSelect}
      forceMount={forceMount}
      className="flex h-9 cursor-default select-none items-center gap-3 rounded-md px-2.5 text-sm text-fg-muted data-[selected=true]:bg-hover data-[selected=true]:text-fg [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-subtle"
    >
      <span className="grid w-4 place-items-center">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {hint && <span className="text-2xs text-fg-subtle">{hint}</span>}
      {shortcut && (
        <span className="flex gap-0.5">
          {shortcut.map((k) => (
            <Kbd key={k}>{k}</Kbd>
          ))}
        </span>
      )}
    </Command.Item>
  );
}
