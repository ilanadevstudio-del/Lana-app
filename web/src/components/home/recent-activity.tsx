"use client";

import { IntegrationLogo } from "@/components/lana/integration-logo";
import { StatusBadge } from "@/components/ui/badge";
import { ListSkeleton } from "@/components/ui/feedback";
import { useActivity } from "@/lib/data/activity";
import type { ActionStatus } from "@/lib/data/types";
import { formatRelative } from "@/lib/format";
import { Panel } from "./panel";

const FINISHED: ActionStatus[] = ["succeeded", "unverified", "partially_completed", "failed"];

export function RecentActivity() {
  const activity = useActivity();
  if (!activity) {
    return (
      <Panel title="Recently done by LANA" href="/activity">
        <ListSkeleton rows={3} className="px-3" />
      </Panel>
    );
  }
  const recent = activity
    .filter((a) => FINISHED.includes(a.status))
    .sort((a, b) => (b.finishedAt ?? b.createdAt).localeCompare(a.finishedAt ?? a.createdAt))
    .slice(0, 4);

  return (
    <Panel title="Recently done by LANA" href="/activity">
      <ul className="py-1">
        {recent.map((a) => (
          <li key={a.id} className="flex items-center gap-3 px-3.5 py-2">
            <IntegrationLogo id={a.integrationId} size={24} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-fg">{a.title}</p>
              <p className="truncate text-xs text-fg-subtle">
                {formatRelative(a.finishedAt ?? a.createdAt)}
                {a.summary && ` · ${a.summary}`}
              </p>
            </div>
            <StatusBadge status={a.status} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}
