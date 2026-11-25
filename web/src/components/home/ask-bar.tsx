"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpIcon, MicrophoneIcon, PlusIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";

// Rotating placeholder, drawn from the PRD's core user experience examples.
const PROMPTS = [
  "What do I have scheduled for today?",
  "Remind me to submit the proposal tomorrow morning",
  "Find the open PRs on EventFi and summarise them",
  "Check my calendar and suggest a time for a call",
  "Create a high-priority task for Friday",
];

export function AskBar() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const hasText = value.trim().length > 0;

  useEffect(() => {
    if (focused || hasText) return;
    const id = setInterval(() => setPromptIndex((i) => (i + 1) % PROMPTS.length), 3800);
    return () => clearInterval(id);
  }, [focused, hasText]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasText) return;
    router.push(`/assistant?q=${encodeURIComponent(value.trim())}`);
  }

  return (
    <div className="sticky bottom-24 z-20 mt-8 md:bottom-6">
      <motion.form
        onSubmit={submit}
        animate={{ scale: focused ? 1.01 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={`glass-strong flex h-16 items-center gap-2 rounded-full px-2.5 transition-shadow duration-300 ${
          focused ? "shadow-[0_0_0_4px_var(--accent-soft),var(--glass-shadow)]" : ""
        }`}
      >
        <button
          type="button"
          aria-label="Add attachment"
          className="grid size-11 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-glass hover:text-foreground"
        >
          <PlusIcon size={20} weight="bold" />
        </button>

        <div className="relative h-full min-w-0 flex-1">
          <label htmlFor="ask-lana" className="sr-only">
            Ask Lana
          </label>
          <input
            id="ask-lana"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoComplete="off"
            className="peer h-full w-full bg-transparent text-base font-medium outline-none"
          />
          {!hasText && (
            <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={focused ? "focused" : promptIndex}
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -14, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                  className="truncate text-base font-medium text-subtle"
                >
                  {focused ? "Ask Lana anything…" : PROMPTS[promptIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          )}
        </div>

        <AnimatePresence mode="popLayout" initial={false}>
          {hasText ? (
            <motion.button
              key="send"
              type="submit"
              aria-label="Send"
              initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              whileTap={{ scale: 0.9 }}
              className="bg-brand grid size-11 shrink-0 place-items-center rounded-full text-white shadow-[0_8px_20px_-8px_var(--accent)]"
            >
              <ArrowUpIcon size={20} weight="bold" />
            </motion.button>
          ) : (
            <motion.button
              key="mic"
              type="button"
              aria-label="Talk to Lana"
              onClick={() => router.push("/assistant?voice=1")}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              whileTap={{ scale: 0.9 }}
              className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"
            >
              <MicrophoneIcon size={20} weight="duotone" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.form>
    </div>
  );
}
