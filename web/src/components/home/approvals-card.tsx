"use client";

import { useState } from "react";
import { ShieldCheckIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { AppIcon } from "@/components/app-icon";
import { SectionCard } from "@/components/section-card";
import type { ApprovalItem } from "@/lib/types";

/**
 * Protected actions waiting on the user (FR-009).
 * Mock behaviour: approving/declining just dismisses the item. Wired to the execution engine later.
 */
export function ApprovalsCard({ items }: { items: ApprovalItem[] }) {
  const [pending, setPending] = useState(items);
  const dismiss = (id: string) => setPending((p) => p.filter((i) => i.id !== id));

  if (pending.length === 0) return null;

  return (
    <SectionCard
      title="Waiting for your approval"
      icon={<ShieldCheckIcon size={18} weight="duotone" />}
      href="/activity"
      count={pending.length}
      className="ring-1 ring-accent/25"
    >
      <ul className="flex flex-col">
        <AnimatePresence initial={false}>
          {pending.map((item) => (
            <motion.li
              key={item.id}
              layout
              exit={{ opacity: 0, x: 40, height: 0, transition: { duration: 0.3 } }}
              className="flex flex-col gap-3 border-t border-hairline py-3 first:border-t-0 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <AppIcon app={item.app} />
                <div className="min-w-0">
                  <p className="font-semibold leading-tight">{item.action}</p>
                  <p className="mt-0.5 truncate text-sm text-muted">{item.detail}</p>
                  <p className="mt-0.5 text-xs text-subtle">Requested {item.requestedAt}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2 pl-12 sm:pl-0">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => dismiss(item.id)}
                  className="glass-strong rounded-full px-4 py-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
                >
                  Decline
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  whileHover={{ y: -1 }}
                  onClick={() => dismiss(item.id)}
                  className="bg-brand rounded-full px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_var(--accent)]"
                >
                  Approve
                </motion.button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </SectionCard>
  );
}
