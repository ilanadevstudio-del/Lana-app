"use client";

import type { ReactNode } from "react";
import { Page, PageHeader, PageToolbar } from "@/components/shell/page";
import { LinkTabs } from "@/components/ui/link-tabs";
import { useActivity } from "@/lib/data/activity";
import { NEEDS_REVIEW } from "./activity-filters";

export function ActivityShell({ children }: { children: ReactNode }) {
  const activity = useActivity();
  const count = (pred: (s: string) => boolean) => activity?.filter((a) => pred(a.status)).length;
  return (
    <Page>
      <PageHeader title="Activity" />
      <PageToolbar className="py-0">
        <LinkTabs
          label="Activity sections"
          items={[
            { href: "/activity", label: "History" },
            { href: "/activity/approvals", label: "Approvals", count: count((s) => s === "awaiting_approval"), tone: "warning" },
            { href: "/activity/scheduled", label: "Scheduled", count: count((s) => s === "scheduled") },
            { href: "/activity/review", label: "Needs review", count: count((s) => NEEDS_REVIEW.includes(s as never)) },
          ]}
        />
      </PageToolbar>
      {children}
    </Page>
  );
}
