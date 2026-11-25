"use client";

import { AnimatePresence, motion } from "motion/react";
import { useNow } from "@/lib/use-now";

const dateFormat = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" });

function partOfDay(d: Date) {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** Greeting + date. Both depend on the user's clock, so they're resolved on the client. */
export function Greeting({ name, summary }: { name: string; summary: string }) {
  const now = useNow();

  return (
    <div className="flex flex-col items-center">
      <h1 className="mt-6 text-[2.5rem] font-semibold leading-[1.05] tracking-tight sm:text-5xl">
        <span className="text-gradient">Hello, {name}</span>
      </h1>
      <p className="mt-2 text-lg font-medium text-foreground/80 sm:text-xl">How can I help you today?</p>

      <div className="mt-4 h-8">
        <AnimatePresence>
          {now && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium text-muted"
            >
              <span className="text-foreground">{partOfDay(now)}</span>
              <span aria-hidden className="size-1 rounded-full bg-subtle" />
              {dateFormat.format(now)}
              <span aria-hidden className="hidden size-1 rounded-full bg-subtle sm:inline" />
              <span className="hidden sm:inline">{summary}</span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
