"use client";

import Link from "next/link";
import { CircleCheckBig } from "lucide-react";
import { IntegrationLogo } from "@/components/lana/integration-logo";
import { TaskCheck } from "@/components/lana/task-check";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState, ListSkeleton } from "@/components/ui/feedback";
import { useActivity } from "@/lib/data/activity";
import { compareTasks, isDueToday, isOverdue, toggleTask, useTasks } from "@/lib/data/tasks";
import { formatRelative } from "@/lib/format";
import { useNow } from "@/lib/use-now";
import { Panel } from "./panel";

/** Approvals first, then overdue and due-today tasks. */
export function AttentionPanel() {
  const activity = useActivity();
  const tasks = useTasks();
  const now = useNow();

  if (!activity || !tasks || !now) {
    return (
      <Panel title="Needs your attention">
        <ListSkeleton rows={4} className="px-3" />
      </Panel>
    );
  }

  const approvals = activity.filter((a) => a.status === "awaiting_approval");
  // Tasks ticked off in the last few minutes stay visible, so completing one doesn't make the list jump.
  const recentlyDone = (completedAt?: string) => !!completedAt && now.getTime() - new Date(completedAt).getTime() < 5 * 60_000;
  const due = tasks
    .filter((t) => (t.status !== "done" ? isOverdue(t, now) || isDueToday(t, now) : isDueToday(t, now) && recentlyDone(t.completedAt)))
    .sort(compareTasks)
    .slice(0, 5);

  if (approvals.length === 0 && due.length === 0) {
    return (
      <Panel title="Needs your attention">
        <EmptyState compact icon={<CircleCheckBig />} title="You're all caught up" description="No approvals waiting and nothing due today." />
      </Panel>
    );
  }

  return (
    <Panel title="Needs your attention">
      {approvals.length > 0 && (
        <ul className="border-b border-line-subtle py-1">
          {approvals.slice(0, 3).map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-3.5 py-2">
              <IntegrationLogo id={a.integrationId} size={24} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-fg">{a.title}</p>
                <p className="text-xs text-fg-subtle">
                  <span className="text-warning">Needs approval</span> · {formatRelative(a.createdAt)}
                </p>
              </div>
              <Link href="/activity/approvals" className={buttonStyles({ size: "sm", variant: "secondary" })}>
                Review
              </Link>
            </li>
          ))}
        </ul>
      )}
      {due.length > 0 && (
        <ul className="py-1">
          {due.map((t) => {
            const overdue = isOverdue(t, now);
            return (
              <li key={t.id} className="flex items-center gap-3 px-3.5 py-2">
                <TaskCheck done={t.status === "done"} priority={t.priority} onToggle={() => toggleTask(t.id)} label={`Complete ${t.title}`} />
                <Link href="/tasks" className="min-w-0 flex-1 truncate text-sm text-fg hover:underline data-[done=true]:text-fg-subtle data-[done=true]:line-through" data-done={t.status === "done"}>
                  {t.title}
                </Link>
                <span className={overdue ? "shrink-0 text-xs text-danger" : "shrink-0 text-xs text-fg-subtle"}>
                  {overdue ? "Overdue" : t.dueTime ? `By ${t.dueTime}` : "Today"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
