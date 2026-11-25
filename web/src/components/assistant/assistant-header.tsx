"use client";

import { ListIcon, NotePencilIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { Orb } from "@/components/orb";
import type { OrbState } from "@/lib/types";

const LABEL: Record<OrbState, string> = {
  idle: "Ready",
  listening: "Listening…",
  understanding: "Understanding…",
  planning: "Planning…",
  awaiting_approval: "Waiting for your approval",
  executing: "Working…",
  completed: "Done",
  failed: "Something went wrong",
  partially_completed: "Partly done",
};

interface AssistantHeaderProps {
  title: string;
  orb: OrbState;
  onOpenList(): void;
  onNew(): void;
}

export function AssistantHeader({ title, orb, onOpenList, onNew }: AssistantHeaderProps) {
  return (
    <header className="flex items-center gap-3 px-1 py-2">
      <button
        type="button"
        onClick={onOpenList}
        aria-label="Conversations"
        className="glass-strong grid size-10 shrink-0 place-items-center rounded-full lg:hidden"
      >
        <ListIcon size={18} weight="bold" />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Orb size={38} state={orb} />
        <div className="min-w-0">
          <p className="truncate font-semibold leading-tight">{title}</p>
          <div aria-live="polite" className="relative h-4 overflow-hidden text-xs font-medium text-muted">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={orb}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={`block ${orb === "awaiting_approval" ? "text-accent" : ""}`}
              >
                {LABEL[orb]}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onNew}
        aria-label="New chat"
        className="glass-strong grid size-10 shrink-0 place-items-center rounded-full lg:hidden"
      >
        <NotePencilIcon size={18} weight="bold" />
      </button>
    </header>
  );
}
