"use client";

import { useRef, useState } from "react";
import { ArrowUpIcon, MicrophoneIcon, PlusIcon, StopIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";

interface ComposerProps {
  busy: boolean;
  onSend(text: string): void;
  onStop(): void;
}

const MAX_HEIGHT = 168;

export function Composer({ busy, onSend, onStop }: ComposerProps) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const hasText = value.trim().length > 0;

  function resize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }

  function submit() {
    if (!hasText || busy) return;
    onSend(value);
    setValue("");
    if (ref.current) ref.current.style.height = "auto";
  }

  return (
    <motion.form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      animate={{ scale: focused ? 1.005 : 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`glass-strong flex items-end gap-2 rounded-[28px] p-2 transition-shadow duration-300 ${
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

      <label htmlFor="composer" className="sr-only">
        Message Lana
      </label>
      <textarea
        id="composer"
        ref={ref}
        rows={1}
        value={value}
        placeholder="Ask Lana anything…"
        onChange={(e) => {
          setValue(e.target.value);
          resize(e.target);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="max-h-42 min-h-11 flex-1 resize-none bg-transparent py-2.5 text-base font-medium outline-none placeholder:text-subtle"
      />

      <AnimatePresence mode="popLayout" initial={false}>
        {busy ? (
          <ComposerButton key="stop" label="Stop" onClick={onStop} className="bg-foreground text-background">
            <StopIcon size={18} weight="fill" />
          </ComposerButton>
        ) : hasText ? (
          <ComposerButton
            key="send"
            label="Send"
            type="submit"
            className="bg-brand text-white shadow-[0_8px_20px_-8px_var(--accent)]"
          >
            <ArrowUpIcon size={20} weight="bold" />
          </ComposerButton>
        ) : (
          <ComposerButton key="mic" label="Voice (coming soon)" className="bg-accent-soft text-accent">
            <MicrophoneIcon size={20} weight="duotone" />
          </ComposerButton>
        )}
      </AnimatePresence>
    </motion.form>
  );
}

function ComposerButton({
  label,
  className,
  children,
  type = "button",
  onClick,
}: {
  label: string;
  className: string;
  children: React.ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <motion.button
      type={type}
      aria-label={label}
      title={label}
      onClick={onClick}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0 }}
      whileTap={{ scale: 0.9 }}
      className={`grid size-11 shrink-0 place-items-center rounded-full ${className}`}
    >
      {children}
    </motion.button>
  );
}
