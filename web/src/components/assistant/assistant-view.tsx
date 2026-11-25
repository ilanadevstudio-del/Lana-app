"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { newChat, selectConversation, send, startConversation, stop } from "@/lib/assistant/engine";
import { useAssistant } from "@/lib/assistant/store";
import type { Conversation } from "@/lib/assistant/types";
import { AssistantHeader } from "./assistant-header";
import { Composer } from "./composer";
import { ConversationList } from "./conversation-list";
import { MessageView } from "./message-view";
import { NewChat } from "./new-chat";

export function AssistantView({ userName }: { userName: string }) {
  const { conversations, activeId } = useAssistant();
  const active = conversations.find((c) => c.id === activeId) ?? null;
  const [listOpen, setListOpen] = useState(false);
  const router = useRouter();

  // Hand-off from the Home ask bar: /assistant?q=… starts a new conversation once.
  const handledQuery = useRef(false);
  useEffect(() => {
    if (handledQuery.current) return;
    handledQuery.current = true;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q?.trim()) startConversation(q);
    if (params.size > 0) router.replace("/assistant");
  }, [router]);

  const submit = (text: string) => (active ? send(active.id, text) : startConversation(text));

  const select = (id: string) => {
    selectConversation(id);
    setListOpen(false);
  };
  const startNew = () => {
    newChat();
    setListOpen(false);
  };

  const list = (
    <ConversationList conversations={conversations} activeId={activeId} onSelect={select} onNew={startNew} />
  );

  return (
    <div className="flex h-dvh gap-4 px-3 pb-[5.75rem] pt-3 md:pb-4 md:pl-0 md:pr-4 md:pt-4">
      <aside className="glass hidden w-72 shrink-0 rounded-[32px] p-3 lg:block">{list}</aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="mx-auto w-full max-w-3xl">
          <AssistantHeader
            title={active?.title ?? "New chat"}
            orb={active?.orb ?? "idle"}
            onOpenList={() => setListOpen(true)}
            onNew={startNew}
          />
        </div>

        {active ? (
          <Thread key={active.id} conversation={active} />
        ) : (
          <div className="flex flex-1 overflow-y-auto">
            <NewChat name={userName} onPick={submit} />
          </div>
        )}

        <div className="mx-auto w-full max-w-3xl pt-3">
          <Composer
            busy={active?.busy ?? false}
            onSend={submit}
            onStop={() => active && stop(active.id)}
          />
        </div>
      </section>

      <AnimatePresence>
        {listOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setListOpen(false)}
            />
            <motion.aside
              role="dialog"
              aria-label="Conversations"
              className="glass-strong fixed inset-y-3 left-3 z-50 w-[min(20rem,calc(100vw-1.5rem))] rounded-[28px] p-3 lg:hidden"
              initial={{ x: "-110%" }}
              animate={{ x: 0 }}
              exit={{ x: "-110%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
            >
              {list}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Thread({ conversation }: { conversation: Conversation }) {
  const ref = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

  // Follow new content while the user is at (or near) the bottom.
  useEffect(() => {
    const el = ref.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  }, [conversation]);

  return (
    <div
      ref={ref}
      onScroll={(e) => {
        const el = e.currentTarget;
        pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      }}
      className="flex-1 overflow-y-auto [mask-image:linear-gradient(to_bottom,transparent,black_24px,black_calc(100%-24px),transparent)]"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-1 py-6">
        {conversation.messages.map((m) => (
          <MessageView key={m.id} convId={conversation.id} message={m} orb={conversation.orb} />
        ))}
      </div>
    </div>
  );
}
