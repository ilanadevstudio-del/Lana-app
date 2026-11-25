"use client";

import { useRouter } from "next/navigation";
import { History } from "lucide-react";
import { Composer } from "@/components/lana/composer";
import { LanaMark } from "@/components/lana/logo";
import { SuggestionList } from "@/components/lana/suggestions";
import { IconButton } from "@/components/ui/button";
import { PageHeader } from "@/components/shell/page";
import { startConversation } from "@/lib/assistant/engine";
import type { SendInput } from "@/lib/assistant/types";
import { useOpenHistory } from "./assistant-layout";

export function NewConversation() {
  const router = useRouter();
  const openHistory = useOpenHistory();

  const start = (input: SendInput) => {
    const id = startConversation(input);
    router.push(`/assistant/${id}`);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="New conversation"
        actions={
          <IconButton label="Conversation history" onClick={openHistory} className="lg:hidden">
            <History />
          </IconButton>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-[680px] flex-col justify-center px-4 py-10 md:px-6">
          <LanaMark size={28} />
          <h2 className="mt-4 text-xl font-semibold tracking-tight text-fg">What should LANA take care of?</h2>
          <p className="mt-1 text-sm text-fg-subtle">
            Ask a question, or describe something to get done across your apps. LANA asks before acting.
          </p>
          <Composer variant="hero" autoFocus onSubmit={start} className="mt-6" />
          <div className="mt-6">
            <p className="mb-1 px-2.5 text-2xs font-medium text-fg-faint">Suggested</p>
            <SuggestionList onPick={(s) => start({ text: s.prompt })} />
          </div>
        </div>
      </div>
    </div>
  );
}
