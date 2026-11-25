"use client";

import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { AppIcon } from "@/components/app-icon";
import { Orb } from "@/components/orb";
import type { AppId } from "@/lib/types";

const SUGGESTIONS: { app: AppId; title: string; prompt: string }[] = [
  { app: "github", title: "Summarise open PRs", prompt: "Find the open PRs on EventFi and summarise them" },
  { app: "gmail", title: "Email Tobi", prompt: "Email Tobi asking if we can have a call by 2:30" },
  { app: "lana", title: "Set a reminder", prompt: "Remind me to review the proposal tomorrow at 9 AM" },
  { app: "notion", title: "Notes to Notion", prompt: "Create a Notion page from today's meeting notes" },
];

export function NewChat({ name, onPick }: { name: string; onPick(prompt: string): void }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-1 py-8 text-center">
      <Orb size={120} />
      <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-[2.75rem]">
        <span className="text-gradient">Hello, {name}</span>
      </h1>
      <p className="mt-2 text-lg font-medium text-foreground/80">How can I help you right now?</p>

      <div className="mt-8 grid w-full grid-cols-2 gap-3">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s.title}
            type="button"
            onClick={() => onPick(s.prompt)}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.06, type: "spring", stiffness: 300, damping: 28 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            className="group glass flex flex-col gap-3 rounded-3xl p-4 text-left"
          >
            <div className="flex w-full items-start justify-between">
              <AppIcon app={s.app} size={36} />
              <ArrowUpRightIcon
                size={16}
                weight="bold"
                className="text-muted transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
              />
            </div>
            <div>
              <p className="font-semibold">{s.title}</p>
              <p className="mt-0.5 line-clamp-2 text-sm text-muted">{s.prompt}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
