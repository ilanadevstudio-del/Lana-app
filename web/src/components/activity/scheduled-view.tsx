"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock, Repeat } from "lucide-react";
import { IntegrationLogo } from "@/components/lana/integration-logo";
import { ProjectChip } from "@/components/lana/project-chip";
import { Button, buttonStyles } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, ListSkeleton } from "@/components/ui/feedback";
import { toast } from "@/components/ui/toast";
import { cancelScheduled, useActivity } from "@/lib/data/activity";
import type { ActionRecord } from "@/lib/data/types";
import { useProjects } from "@/lib/data/workspace";
import { formatDayInline, formatTime } from "@/lib/format";

/** Actions LANA will run later, with what each will do and anything blocking it. */
export function ScheduledView() {
  const activity = useActivity();
  const projects = useProjects();
  const [cancelling, setCancelling] = useState<ActionRecord | null>(null);

  if (!activity || !projects) return <ListSkeleton rows={4} className="mx-auto mt-5 w-full max-w-[760px] px-4" />;
  const scheduled = activity.filter((a) => a.status === "scheduled").sort((a, b) => (a.runAt ?? "").localeCompare(b.runAt ?? ""));

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[760px] px-4 pb-16 pt-5 md:px-6">
        {scheduled.length === 0 ? (
          <EmptyState icon={<CalendarClock />} title="Nothing scheduled" description="Ask LANA to do something later or on a schedule, e.g. “Every Friday, post a summary to Slack”." />
        ) : (
          <ul className="flex flex-col gap-3">
            {scheduled.map((a) => {
              const project = projects.find((p) => p.id === a.projectId);
              return (
                <li key={a.id} className="rounded-lg border border-line bg-panel">
                  <div className="flex items-start gap-3 p-3.5">
                    <IntegrationLogo id={a.integrationId} size={28} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-fg">{a.title}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-subtle">
                        <span className="flex items-center gap-1.5">
                          <CalendarClock className="size-3.5" />
                          Next run {a.runAt ? `${formatDayInline(a.runAt)} at ${formatTime(a.runAt)}` : "not set"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Repeat className="size-3.5" />
                          {a.origin.label}
                        </span>
                        {project && <ProjectChip project={project} link />}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setCancelling(a)}>
                      Cancel
                    </Button>
                  </div>
                  <ol className="flex flex-wrap gap-x-2 gap-y-1 border-t border-line-subtle px-3.5 py-2.5 text-xs text-fg-muted">
                    {a.steps.map((s, i) => (
                      <li key={s.id} className="flex items-center gap-2">
                        {i > 0 && <span aria-hidden className="text-fg-faint">→</span>}
                        {s.label}
                      </li>
                    ))}
                  </ol>
                  {a.error && (
                    <div className="flex flex-wrap items-center gap-2 border-t border-warning/20 bg-warning-soft px-3.5 py-2 text-xs text-fg">
                      <AlertTriangle className="size-3.5 text-warning" />
                      <span className="flex-1">{a.error}</span>
                      <Link href="/integrations" className={buttonStyles({ size: "sm", variant: "secondary" })}>
                        Fix in Integrations
                      </Link>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <ConfirmDialog
        open={!!cancelling}
        onOpenChange={(o) => !o && setCancelling(null)}
        title="Cancel this scheduled action?"
        description={cancelling ? `“${cancelling.title}” won't run again. You can ask LANA to set it up again later.` : undefined}
        confirmLabel="Cancel schedule"
        destructive
        onConfirm={() => {
          if (!cancelling) return;
          cancelScheduled(cancelling.id);
          toast({ title: "Schedule cancelled", description: cancelling.title });
        }}
      />
    </div>
  );
}
