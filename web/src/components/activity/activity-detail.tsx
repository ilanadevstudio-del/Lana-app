"use client";

import Link from "next/link";
import { CalendarClock, MessageSquare, Repeat, Zap } from "lucide-react";
import { ApprovalPanel } from "@/components/lana/approval-panel";
import { ExecutionTrace } from "@/components/lana/execution-trace";
import { ProjectChip } from "@/components/lana/project-chip";
import { StatusBadge } from "@/components/ui/badge";
import { approveAction, rejectAction } from "@/lib/data/activity";
import { integrationName } from "@/lib/data/integration-catalog";
import type { ActionRecord, Project } from "@/lib/data/types";
import { formatLongDate, formatRelative, formatTime } from "@/lib/format";
import { ACTION_STATUS } from "@/lib/status";

const ORIGIN_ICON = { conversation: MessageSquare, automation: Zap, schedule: Repeat };

/** Full record of one action: what was asked, what ran, what came back. */
export function ActivityDetail({ record, project }: { record: ActionRecord; project?: Project }) {
  const OriginIcon = ORIGIN_ICON[record.origin.kind];
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <StatusBadge status={record.status} />
          <span className="text-xs text-fg-subtle">via {integrationName(record.integrationId)}</span>
        </div>
        <h2 className="text-base font-semibold leading-6 text-fg">{record.title}</h2>
        <p className="mt-1 text-xs text-fg-subtle">{ACTION_STATUS[record.status].description}</p>
      </div>

      <ExecutionTrace action={record} defaultOpen>
        {record.status === "awaiting_approval" && record.fields && (
          <ApprovalPanel
            integrationId={record.integrationId}
            fields={record.fields}
            confirmLabel="Approve"
            onApprove={(fields) => approveAction(record.id, fields)}
            onDecline={() => rejectAction(record.id)}
          />
        )}
      </ExecutionTrace>

      {record.fields && record.status !== "awaiting_approval" && (
        <dl className="overflow-hidden rounded-lg border border-line text-sm">
          {record.fields.map((f) => (
            <div key={f.key} className="grid grid-cols-[96px_1fr] gap-3 border-b border-line-subtle px-3 py-2 last:border-0">
              <dt className="text-xs text-fg-subtle">{f.label}</dt>
              <dd className="whitespace-pre-wrap text-fg">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <dl className="grid grid-cols-[96px_1fr] gap-y-2.5 text-sm">
        <dt className="text-fg-subtle">Requested</dt>
        <dd className="text-fg">
          {formatLongDate(record.createdAt)}, {formatTime(record.createdAt)}
        </dd>
        {record.runAt && (
          <>
            <dt className="text-fg-subtle">Runs</dt>
            <dd className="flex items-center gap-1.5 text-fg">
              <CalendarClock className="size-3.5 text-fg-subtle" />
              {formatRelative(record.runAt)}
            </dd>
          </>
        )}
        {record.finishedAt && (
          <>
            <dt className="text-fg-subtle">Finished</dt>
            <dd className="text-fg">{formatRelative(record.finishedAt)}</dd>
          </>
        )}
        <dt className="text-fg-subtle">Origin</dt>
        <dd className="flex items-center gap-1.5 text-fg">
          <OriginIcon className="size-3.5 text-fg-subtle" />
          {record.origin.kind === "conversation" ? (
            <Link href="/assistant" className="hover:underline">
              {record.origin.label}
            </Link>
          ) : (
            record.origin.label
          )}
        </dd>
        {project && (
          <>
            <dt className="text-fg-subtle">Project</dt>
            <dd>
              <ProjectChip project={project} link className="text-sm" />
            </dd>
          </>
        )}
      </dl>
    </div>
  );
}
