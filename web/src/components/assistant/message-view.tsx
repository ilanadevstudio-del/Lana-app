"use client";

import { motion } from "motion/react";
import { OrbAvatar } from "@/components/orb-avatar";
import type { Message } from "@/lib/assistant/types";
import type { OrbState } from "@/lib/types";
import { ActionCard } from "./action-card";
import { Markdown } from "./markdown";

const THINKING: Partial<Record<OrbState, string>> = {
  understanding: "Understanding your request",
  planning: "Planning the steps",
  executing: "Working on it",
};

interface MessageViewProps {
  convId: string;
  message: Message;
  orb: OrbState;
}

export function MessageView({ convId, message, orb }: MessageViewProps) {
  if (message.role === "user") {
    const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
    return (
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
        className="flex justify-end"
      >
        <p className="bg-brand max-w-[85%] whitespace-pre-wrap rounded-[22px] rounded-br-md px-4 py-2.5 font-medium text-white shadow-[0_10px_24px_-12px_var(--accent)] sm:max-w-[75%]">
          {text}
        </p>
      </motion.div>
    );
  }

  const empty = message.parts.length === 0;
  const lastIndex = message.parts.length - 1;

  return (
    <div className="flex gap-3">
      <div className="pt-0.5">
        <OrbAvatar size={28} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 text-[15.5px] leading-relaxed">
        {empty && message.streaming && <Thinking label={THINKING[orb] ?? "Thinking"} />}
        {message.parts.map((part, i) =>
          part.type === "text" ? (
            <div key={i} className={message.streaming && i === lastIndex ? "streaming-caret" : undefined}>
              <Markdown text={part.text} />
            </div>
          ) : (
            <ActionCard key={part.action.id} convId={convId} msgId={message.id} action={part.action} />
          ),
        )}
      </div>
    </div>
  );
}

function Thinking({ label }: { label: string }) {
  return (
    <motion.p
      key={label}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="shimmer-text pt-0.5 font-medium"
    >
      {label}…
    </motion.p>
  );
}
