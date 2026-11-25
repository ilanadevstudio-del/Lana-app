"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, History, MessageSquareDashed, MoreHorizontal, SquarePen, Trash2 } from "lucide-react";
import { Composer } from "@/components/lana/composer";
import { Badge } from "@/components/ui/badge";
import { buttonStyles, IconButton } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { toast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { PageHeader } from "@/components/shell/page";
import { send, stop } from "@/lib/assistant/engine";
import { deleteConversation, useConversations } from "@/lib/assistant/store";
import type { Conversation, Phase } from "@/lib/assistant/types";
import { useOpenHistory } from "./assistant-layout";
import { AssistantMessage, UserMessage } from "./message";

const PHASE_BADGE: Partial<Record<Phase, { label: string; tone: "accent" | "warning" }>> = {
  understanding: { label: "Thinking", tone: "accent" },
  planning: { label: "Planning", tone: "accent" },
  responding: { label: "Responding", tone: "accent" },
  executing: { label: "Working", tone: "accent" },
  awaiting_approval: { label: "Needs your approval", tone: "warning" },
};

export function ConversationView({ id }: { id: string }) {
  const conversations = useConversations();
  if (!conversations) return <ConversationSkeleton />;
  const conv = conversations.find((c) => c.id === id);
  if (!conv) return <MissingConversation />;
  return <Thread conv={conv} />;
}

function Thread({ conv }: { conv: Conversation }) {
  const router = useRouter();
  const openHistory = useOpenHistory();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const stick = useRef(true);
  const badge = PHASE_BADGE[conv.phase];

  // Follow new content while the user is at the bottom; leave them alone if they scrolled up.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [conv.messages]);

  useEffect(() => {
    stick.current = true;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conv.id]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    stick.current = near;
    setAtBottom(near);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title={conv.title}
        meta={badge && <Badge tone={badge.tone} dot>{badge.label}</Badge>}
        actions={
          <>
            <Tooltip content="History">
              <IconButton label="Conversation history" onClick={openHistory} className="lg:hidden">
                <History />
              </IconButton>
            </Tooltip>
            <Tooltip content="New conversation" shortcut={["N"]}>
              <Link href="/assistant" aria-label="New conversation" className={buttonStyles({ variant: "ghost", className: "w-8 px-0" })}>
                <SquarePen />
              </Link>
            </Tooltip>
            <Menu>
              <MenuTrigger asChild>
                <IconButton label="Conversation options">
                  <MoreHorizontal />
                </IconButton>
              </MenuTrigger>
              <MenuContent align="end">
                <MenuItem
                  icon={<Trash2 />}
                  danger
                  onSelect={() => {
                    stop(conv.id);
                    deleteConversation(conv.id);
                    toast({ title: "Conversation deleted" });
                    router.push("/assistant");
                  }}
                >
                  Delete conversation
                </MenuItem>
              </MenuContent>
            </Menu>
          </>
        }
      />

      <div ref={scrollRef} onScroll={onScroll} className="relative min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[760px] flex-col gap-7 px-4 pb-6 pt-6 md:px-6" aria-live="polite">
          {conv.messages.map((m, i) =>
            m.role === "user" ? (
              <UserMessage key={m.id} message={m} />
            ) : (
              <AssistantMessage key={m.id} message={m} convId={conv.id} phase={conv.phase} isLast={i === conv.messages.length - 1} />
            ),
          )}
        </div>
      </div>

      <div className="relative shrink-0 px-3 pb-3 md:px-6 md:pb-5">
        {!atBottom && (
          <button
            type="button"
            onClick={() => {
              const el = scrollRef.current;
              if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
            }}
            className="animate-fade-in absolute -top-11 left-1/2 flex h-7 -translate-x-1/2 items-center gap-1.5 rounded-full border border-line bg-overlay px-3 text-xs text-fg-muted shadow-popover hover:text-fg"
          >
            <ArrowDown className="size-3.5" /> Jump to latest
          </button>
        )}
        <div className="mx-auto max-w-[760px]">
          <Composer
            busy={conv.busy}
            onStop={() => stop(conv.id)}
            onSubmit={(input) => {
              stick.current = true;
              void send(conv.id, input);
            }}
            placeholder="Reply to LANA…"
          />
          <p className="mt-2 hidden text-center text-2xs text-fg-faint md:block">
            Preview: actions are simulated. LANA always asks before changing anything in your apps.
          </p>
        </div>
      </div>
    </div>
  );
}

function ConversationSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-12 items-center border-b border-line-subtle px-5">
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-6 px-6 pt-6" role="status" aria-label="Loading conversation">
        <Skeleton className="ml-auto h-9 w-2/3 rounded-xl" />
        <div className="flex gap-3">
          <Skeleton className="size-[22px] rounded-md" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MissingConversation() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        icon={<MessageSquareDashed />}
        title="This conversation isn't available"
        description="It may have been deleted. In the preview, conversations also reset when you reload the page."
        action={
          <Link href="/assistant" className={buttonStyles({ variant: "primary" })}>
            Start a new conversation
          </Link>
        }
      />
    </div>
  );
}
