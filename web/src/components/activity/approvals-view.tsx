"use client";

import Link from "next/link";
import { MessageSquare, Repeat, ShieldCheck, Zap } from "lucide-react";
import { ApprovalPanel } from "@/components/lana/approval-panel";
import { ExecutionTrace } from "@/components/lana/execution-trace";
import { ProjectChip } from "@/components/lana/project-chip";
import { Callout, EmptyState, Skeleton } from "@/components/ui/feedback";
import { toast } from "@/components/ui/toast";
import { approveAction, rejectAction, useActivity } from "@/lib/data/activity";
import type { ActionRecord, Project } from "@/lib/data/types";
import { useProjects } from "@/lib/data/workspace";
import { formatRelative } from "@/lib/format";

const ORIGIN_ICON = { conversation: MessageSquare, automation: Zap, schedule: Repeat };

/**
 * The approvals queue. Each proposed action shows its plan, the exact content, and a clear decision.
 * Decided items stay visible below so the outcome of a decision is never hidden.
 */
export function ApprovalsView() {
  const activity = useActivity();
  const projects = useProjects();

  if (!activity || !projects) {
    return (
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-3 px-4 py-5" role="status" aria-label="Loading approvals">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  const pending = activity.filter((a) => a.status === "awaiting_approval").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const decided = activity.filter((a) => a.decidedAt).sort((a, b) => b.decidedAt!.localeCompare(a.decidedAt!));

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4 px-4 pb-16 pt-5 md:px-6">
        <Callout icon={<ShieldCheck />}>
          LANA never sends, changes or deletes anything in your apps without your approval. Review the details, edit if needed, then approve or decline.
        </Callout>

        {pending.length === 0 ? (
          <EmptyState icon={<ShieldCheck />} title="No approvals waiting" description="When LANA needs your go-ahead, the request will appear here and on Home." />
        ) : (
          <ul className="flex flex-col gap-4" aria-label="Pending approvals">
            {pending.map((a) => (
              <li key={a.id}>
                <ApprovalItem record={a} project={projects.find((p) => p.id === a.projectId)} />
              </li>
            ))}
          </ul>
        )}

        {decided.length > 0 && (
          <section className="mt-4">
            <h2 className="mb-2 text-xs font-medium text-fg-subtle">Decided recently</h2>
            <ul className="flex flex-col gap-2">
              {decided.map((a) => (
                <li key={a.id}>
                  <ExecutionTrace action={a} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function ApprovalItem({ record, project }: { record: ActionRecord; project?: Project }) {
  const OriginIcon = ORIGIN_ICON[record.origin.kind];
  return (
    <article aria-label={record.title}>
      <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-xs text-fg-subtle">
        <span className="flex items-center gap-1.5">
          <OriginIcon className="size-3.5" />
          {record.origin.kind === "conversation" ? (
            <Link href="/assistant" className="hover:text-fg">
              {record.origin.label}
            </Link>
          ) : (
            record.origin.label
          )}
        </span>
        {project && <ProjectChip project={project} link />}
        <span className="ml-auto">{formatRelative(record.createdAt)}</span>
      </div>
      <ExecutionTrace action={record}>
        {record.fields && (
          <ApprovalPanel
            integrationId={record.integrationId}
            fields={record.fields}
            confirmLabel="Approve"
            onApprove={(fields) => {
              approveAction(record.id, fields);
              toast({ title: "Approved", description: `${record.title}. Simulated in the preview; nothing is sent.` });
            }}
            onDecline={() => {
              rejectAction(record.id);
              toast({ title: "Declined", description: "Nothing was changed." });
            }}
          />
        )}
      </ExecutionTrace>
    </article>
  );
}
