"use client";

import { NotePencilIcon } from "@phosphor-icons/react";
import { motion } from "motion/react";
import type { Conversation, MessagePart } from "@/lib/assistant/types";

function preview(c: Conversation) {
  const last = c.messages.at(-1);
  if (!last) return "New conversation";
  const part: MessagePart | undefined = last.parts.findLast((p) => p.type === "text") ?? last.parts.at(-1);
  if (!part) return "…";
  return part.type === "text" ? part.text.replace(/[*`]|\[|\]\([^)]*\)/g, "") : part.action.title;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect(id: string): void;
  onNew(): void;
}

export function ConversationList({ conversations, activeId, onSelect, onNew }: ConversationListProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-2 pb-3 pt-1">
        <h2 className="text-lg font-semibold tracking-tight">Conversations</h2>
        <motion.button
          type="button"
          onClick={onNew}
          whileTap={{ scale: 0.92 }}
          aria-label="New chat"
          title="New chat"
          className="bg-brand grid size-9 place-items-center rounded-full text-white shadow-[0_8px_18px_-8px_var(--accent)]"
        >
          <NotePencilIcon size={17} weight="bold" />
        </motion.button>
      </div>

      <ul className="-mx-1 flex flex-1 flex-col gap-1 overflow-y-auto px-1">
        {conversations.map((c) => {
          const active = c.id === activeId;
          return (
            <motion.li key={c.id} layout transition={{ type: "spring", stiffness: 400, damping: 36 }}>
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                aria-current={active ? "true" : undefined}
                className={`relative w-full rounded-2xl px-3 py-2.5 text-left transition-colors ${
                  active ? "" : "hover:bg-glass"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="conversation-active"
                    className="glass-strong absolute inset-0 rounded-2xl"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{c.title}</span>
                  {c.busy && <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-accent" />}
                  {!c.busy && c.orb === "awaiting_approval" && (
                    <span className="shrink-0 rounded-full bg-accent-soft px-1.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                      Approve
                    </span>
                  )}
                </span>
                <span className="relative mt-0.5 block truncate text-xs text-muted">{preview(c)}</span>
              </button>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
