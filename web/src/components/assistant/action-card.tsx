"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRightIcon,
  CheckIcon,
  CircleNotchIcon,
  PencilSimpleIcon,
  ShieldCheckIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { APPS, AppIcon } from "@/components/app-icon";
import { StateBadge } from "@/components/state-badge";
import { approve, decline } from "@/lib/assistant/engine";
import type { ActionRun, ActionStep, ApprovalField, RunState } from "@/lib/assistant/types";

interface ActionCardProps {
  convId: string;
  msgId: string;
  action: ActionRun;
}

export function ActionCard({ convId, msgId, action }: ActionCardProps) {
  const awaiting = action.state === "awaiting_approval";
  const finished: RunState[] = ["completed", "failed", "partially_completed", "cancelled"];
  const isFinished = finished.includes(action.state);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className={`glass my-1 overflow-hidden rounded-3xl transition-shadow duration-500 ${
        awaiting ? "shadow-[0_0_0_1.5px_var(--accent-soft),0_0_32px_-8px_var(--accent)]" : ""
      }`}
    >
      <header className="flex items-center gap-3 px-4 pb-2 pt-4">
        <AppIcon app={action.app} size={34} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight">{action.title}</p>
          <p className="text-xs text-muted">{APPS[action.app].label}</p>
        </div>
        <StateBadge state={action.state} />
      </header>

      <ol className="px-4 pb-3 pt-1">
        {action.steps.map((step, i) => (
          <StepRow key={step.id} step={step} last={i === action.steps.length - 1} dimPending={isFinished} />
        ))}
      </ol>

      <AnimatePresence initial={false}>
        {action.approval && (
          <motion.div
            key="approval"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <ApprovalPanel
              key={action.approval.decision ?? "pending"}
              fields={action.approval.fields}
              decision={action.approval.decision}
              active={awaiting}
              onApprove={(fields) => approve(convId, msgId, action.id, fields)}
              onDecline={() => decline(convId, msgId, action.id)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {action.error && (
        <div className="mx-3 mb-3 flex flex-col gap-3 rounded-2xl bg-[color-mix(in_oklab,var(--danger)_10%,transparent)] p-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-start gap-2 text-sm">
            <WarningCircleIcon size={18} weight="duotone" className="mt-px shrink-0 text-danger" />
            <span>{action.error.message}</span>
          </div>
          {action.error.cta && (
            <Link
              href={action.error.cta.href}
              className="bg-brand shrink-0 self-start rounded-full px-4 py-2 text-sm font-semibold text-white sm:self-auto"
            >
              {action.error.cta.label}
            </Link>
          )}
        </div>
      )}

      {action.links && action.links.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-4">
          {action.links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="group glass-strong inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors hover:text-accent"
            >
              {l.label}
              <ArrowUpRightIcon
                size={14}
                weight="bold"
                className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </a>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Steps ─────────────────────────────────────────────────────────────────────

function StepRow({ step, last, dimPending }: { step: ActionStep; last: boolean; dimPending: boolean }) {
  const skipped = dimPending && step.state === "pending";
  return (
    <li className="relative flex gap-3 pb-2.5 last:pb-0">
      {!last && (
        <span
          aria-hidden
          className={`absolute bottom-0 left-[11px] top-6 w-px transition-colors duration-500 ${
            step.state === "done" ? "bg-success/40" : "bg-hairline"
          }`}
        />
      )}
      <StepIcon state={step.state} />
      <div className={`min-w-0 pt-0.5 ${skipped ? "opacity-45" : ""}`}>
        <p
          className={`text-sm font-medium transition-colors ${
            step.state === "pending" ? "text-muted" : step.state === "failed" ? "text-danger" : ""
          }`}
        >
          {step.label}
        </p>
        <AnimatePresence>
          {step.detail && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-muted"
            >
              {step.detail}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </li>
  );
}

function StepIcon({ state }: { state: ActionStep["state"] }) {
  return (
    <span className="relative z-10 grid size-6 shrink-0 place-items-center">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={state}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 26 }}
          className="grid size-6 place-items-center rounded-full"
          style={
            state === "done"
              ? { background: "var(--success)", color: "white" }
              : state === "failed"
                ? { background: "var(--danger)", color: "white" }
                : state === "running"
                  ? { background: "var(--accent-soft)", color: "var(--accent)" }
                  : { border: "1.5px dashed var(--subtle)" }
          }
        >
          {state === "done" && <CheckIcon size={13} weight="bold" />}
          {state === "failed" && <XIcon size={12} weight="bold" />}
          {state === "running" && <CircleNotchIcon size={14} weight="bold" className="animate-spin" />}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// ── Approval ──────────────────────────────────────────────────────────────────

interface ApprovalPanelProps {
  fields: ApprovalField[];
  decision?: "approved" | "declined";
  active: boolean;
  onApprove(fields: ApprovalField[]): void;
  onDecline(): void;
}

function ApprovalPanel({ fields, decision, active, onApprove, onDecline }: ApprovalPanelProps) {
  const [draft, setDraft] = useState(fields);
  const [editing, setEditing] = useState(false);
  const canEdit = active && fields.some((f) => f.editable);

  const setValue = (key: string, value: string) =>
    setDraft((d) => d.map((f) => (f.key === key ? { ...f, value } : f)));

  return (
    <div className="mx-3 mb-3 rounded-2xl border border-hairline bg-glass-strong p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
        <ShieldCheckIcon size={14} weight="duotone" className="text-accent" />
        {decision === "approved" ? "Approved" : decision === "declined" ? "Declined" : "Review before Lana continues"}
      </div>

      <dl className="flex flex-col gap-2">
        {draft.map((f) => (
          <div key={f.key} className={f.multiline ? "flex flex-col gap-1" : "flex items-baseline gap-3"}>
            <dt className="w-24 shrink-0 text-sm text-muted">{f.label}</dt>
            <dd className="min-w-0 flex-1 text-sm font-medium">
              {editing && f.editable ? (
                f.multiline ? (
                  <textarea
                    aria-label={f.label}
                    value={f.value}
                    onChange={(e) => setValue(f.key, e.target.value)}
                    rows={5}
                    className="w-full resize-none rounded-xl border border-hairline bg-background/60 p-2.5 outline-none focus:shadow-[0_0_0_3px_var(--accent-soft)]"
                  />
                ) : (
                  <input
                    aria-label={f.label}
                    value={f.value}
                    onChange={(e) => setValue(f.key, e.target.value)}
                    className="w-full rounded-xl border border-hairline bg-background/60 px-2.5 py-1.5 outline-none focus:shadow-[0_0_0_3px_var(--accent-soft)]"
                  />
                )
              ) : (
                <span className={f.multiline ? "block whitespace-pre-line rounded-xl bg-background/40 p-2.5" : "break-words"}>
                  {f.value}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      {active && (
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={onDecline}
            className="glass rounded-full px-4 py-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
          >
            Decline
          </motion.button>
          {canEdit && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => setEditing((e) => !e)}
              className="glass inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold"
            >
              {editing ? <CheckIcon size={14} weight="bold" /> : <PencilSimpleIcon size={14} weight="bold" />}
              {editing ? "Done" : "Edit"}
            </motion.button>
          )}
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            whileHover={{ y: -1 }}
            onClick={() => onApprove(draft)}
            className="bg-brand rounded-full px-5 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_var(--accent)]"
          >
            Approve
          </motion.button>
        </div>
      )}
    </div>
  );
}
