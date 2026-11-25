"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Sheet } from "@/components/ui/overlays";
import { ConversationList } from "./conversation-list";

const HistoryContext = createContext<() => void>(() => {});

/** Opens the history sheet on screens where the history column is hidden. */
export const useOpenHistory = () => useContext(HistoryContext);

/** Assistant frame: history column on large screens, a sheet below that. */
export function AssistantLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <HistoryContext.Provider value={() => setOpen(true)}>
      <div className="flex min-h-0 flex-1">
        <aside aria-label="Conversations" className="hidden w-64 shrink-0 border-r border-line-subtle lg:block">
          <ConversationList />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
      <Sheet open={open} onOpenChange={setOpen} title="Conversations" side="left">
        <ConversationList onNavigate={() => setOpen(false)} />
      </Sheet>
    </HistoryContext.Provider>
  );
}
