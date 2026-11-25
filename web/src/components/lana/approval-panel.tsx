"use client";

import { useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { AlignLeft, FileText, Link2 } from "lucide-react";
import type { ApprovalAttachment } from "@/lib/assistant/types";
import { Pencil, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/cn";
import { integrationName } from "@/lib/data/integration-catalog";
import type { ActionField, IntegrationId } from "@/lib/data/types";
import { formatTime } from "@/lib/format";

/**
 * Review step for a consequential action. Shows exactly what will happen,
 * lets the user adjust editable fields, and requires an explicit decision.
 * Ctrl/⌘ + Enter approves when focus is inside the panel.
 */
export function ApprovalPanel({
  integrationId,
  fields,
  confirmLabel,
  decision,
  decidedAt,
  onApprove,
  onDecline,
  disabled,
  disabledReason,
  attachments,
  className,
}: {
  integrationId: IntegrationId;
  fields: ActionField[];
  confirmLabel: string;
  decision?: "approved" | "declined";
  decidedAt?: string;
  onApprove: (fields: ActionField[]) => void;
  onDecline: () => void;
  /** True when the action can no longer be approved (e.g. the session that proposed it ended). */
  disabled?: boolean;
  /** Shown instead of the shortcut hint when the panel is disabled. */
  disabledReason?: string;
  /** Library items that will be attached or pasted. */
  attachments?: ApprovalAttachment[];
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.key, f.value])));
  const editable = fields.some((f) => f.editable);
  const current = fields.map((f) => ({ ...f, value: values[f.key] ?? f.value }));
  const invalid = current.some((f) => f.editable && !f.value.trim());

  if (decision) {
    return (
      <div className={cn("flex items-center gap-2 border-t border-line-subtle px-3 py-2 text-xs text-fg-subtle", className)}>
        {decision === "approved" ? <ShieldCheck className="size-3.5 text-fg-muted" /> : <X className="size-3.5" />}
        {decision === "approved" ? "Approved by you" : "Declined by you"}
        {decidedAt && <span className="text-fg-faint">· {formatTime(decidedAt)}</span>}
      </div>
    );
  }

  function onKeyDown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !disabled && !invalid) {
      e.preventDefault();
      onApprove(current);
    }
  }

  return (
    <section
      aria-label="Approval required"
      onKeyDown={onKeyDown}
      className={cn("border-t border-accent-line/40 bg-accent-soft/40", className)}
    >
      <div className="flex items-center gap-2 px-3 pt-3">
        <ShieldCheck className="size-4 text-accent-text" />
        <h3 className="text-sm font-medium text-fg">Review before LANA continues</h3>
        <span className="ml-auto hidden text-xs text-fg-subtle sm:inline">via {integrationName(integrationId)}</span>
      </div>

      <dl className="mx-3 mt-2.5 overflow-hidden rounded-md border border-line bg-panel">
        {current.map((f) => (
          <div
            key={f.key}
            className={cn(
              "grid gap-1 border-b border-line-subtle px-3 py-2 last:border-0 sm:grid-cols-[96px_1fr] sm:gap-3",
              f.multiline && "sm:items-start",
            )}
          >
            <dt className="pt-px text-xs text-fg-subtle">{f.label}</dt>
            <dd className="min-w-0 text-sm text-fg">
              {editing && f.editable ? (
                f.multiline ? (
                  <Textarea
                    aria-label={f.label}
                    value={values[f.key]}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    rows={Math.min(8, Math.max(3, values[f.key].split("\n").length + 1))}
                  />
                ) : (
                  <Input
                    aria-label={f.label}
                    value={values[f.key]}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    size="sm"
                  />
                )
              ) : f.multiline ? (
                <p className="whitespace-pre-wrap leading-[22px] text-fg">{f.value}</p>
              ) : (
                <span className="break-words">{f.value}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      {attachments && attachments.length > 0 && (
        <div className="mx-3 mt-2 rounded-md border border-line bg-panel px-3 py-2">
          <p className="mb-1.5 text-xs text-fg-subtle">Attachments</p>
          <ul className="flex flex-col gap-1.5">
            {attachments.map((att) => {
              const Icon = att.kind === "link" ? Link2 : att.kind === "text" ? AlignLeft : FileText;
              return (
                <li key={att.libraryItemId}>
                  <Link href="/library" className="flex items-center gap-2.5 rounded text-sm hover:underline">
                    <span className="grid size-7 shrink-0 place-items-center rounded-md border border-line bg-raised">
                      <Icon className="size-3.5 text-fg-subtle" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-fg">{att.name}</span>
                      <span className="block truncate text-xs text-fg-subtle">{att.detail}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 px-3 py-3">
        <Button variant="primary" size="md" onClick={() => onApprove(current)} disabled={disabled || invalid}>
          {confirmLabel}
        </Button>
        <Button variant="secondary" size="md" onClick={onDecline} disabled={disabled}>
          Decline
        </Button>
        {editable && (
          <Button variant="ghost" size="md" icon={<Pencil />} onClick={() => setEditing((e) => !e)} disabled={disabled}>
            {editing ? "Done editing" : "Edit"}
          </Button>
        )}
        <span className="ml-auto hidden items-center gap-1 text-2xs text-fg-subtle md:flex">
          {disabled ? (
            (disabledReason ?? "This request expired. Ask again to retry.")
          ) : (
            <>
              <Kbd>Ctrl</Kbd>
              <Kbd>↵</Kbd> to approve
            </>
          )}
        </span>
      </div>
    </section>
  );
}
