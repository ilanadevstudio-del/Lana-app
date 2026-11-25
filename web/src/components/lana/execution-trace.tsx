"use client";

import { useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, ChevronDown, Minus, X } from "lucide-react";
import { PreviewTag, StatusBadge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { ActionLink, ActionStatus, ActionStep, IntegrationId, StepState } from "@/lib/data/types";
import { IntegrationLogo } from "./integration-logo";

/** The fields an execution trace needs; both chat actions and activity records satisfy it. */
export interface TraceSource {
  integrationId: IntegrationId;
  title: string;
  status: ActionStatus;
  steps: ActionStep[];
  summary?: string;
  error?: string | { message: string; cta?: ActionLink };
  links?: ActionLink[];
  simulated?: boolean;
}

const LIVE: ActionStatus[] = ["executing", "awaiting_approval"];

/**
 * LANA's execution trace: a compact card that shows what LANA is doing and what happened.
 * Collapsed, it shows the current step or the outcome. Expanded, a step rail with details.
 * It opens itself while work is live or something went wrong, and folds away once it succeeds.
 */
export function ExecutionTrace({
  action,
  children,
  className,
  defaultOpen,
  bare,
}: {
  action: TraceSource;
  /** Extra content under the steps, e.g. the approval panel. */
  children?: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  /** Render without the outer card (inside panels that already have a frame). */
  bare?: boolean;
}) {
  const auto = LIVE.includes(action.status) || action.status === "failed" || action.status === "partially_completed";
  const [override, setOverride] = useState<boolean | null>(defaultOpen ?? null);
  const open = override ?? auto;
  const bodyId = useId();

  const running = action.steps.find((s) => s.state === "running");
  const errorMessage = typeof action.error === "string" ? action.error : action.error?.message;
  const errorCta = typeof action.error === "object" ? action.error.cta : undefined;
  const subline =
    action.status === "executing" && running
      ? `${running.label}…`
      : action.status === "awaiting_approval"
        ? "Waiting for your approval"
        : (errorMessage ?? action.summary);
  const done = action.steps.filter((s) => s.state === "done").length;

  return (
    <div
      className={cn(
        !bare && "overflow-hidden rounded-lg border bg-panel transition-colors",
        !bare && (action.status === "awaiting_approval" ? "border-accent-line" : "border-line"),
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOverride(!open)}
        aria-expanded={open}
        aria-controls={bodyId}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-hover"
      >
        <IntegrationLogo id={action.integrationId} size={26} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-fg">{action.title}</span>
          {subline && (
            <span
              className={cn(
                "block truncate text-xs",
                action.status === "executing" ? "shimmer-text" : action.status === "failed" ? "text-danger" : "text-fg-subtle",
              )}
            >
              {subline}
            </span>
          )}
        </span>
        <span className="hidden text-2xs tabular-nums text-fg-faint sm:inline">
          {done}/{action.steps.length}
        </span>
        <StatusBadge status={action.status} />
        <ChevronDown className={cn("size-4 shrink-0 text-fg-faint transition-transform duration-200", open && "rotate-180")} />
      </button>

      <div
        id={bodyId}
        className={cn("grid transition-[grid-template-rows] duration-200 ease-(--ease-out)", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
      >
        <div className="min-h-0 overflow-hidden">
          <ol className="border-t border-line-subtle px-3 pb-1 pt-2.5">
            {action.steps.map((s, i) => (
              <StepRow key={s.id} step={s} last={i === action.steps.length - 1} />
            ))}
          </ol>
          {(errorMessage || action.links?.length || action.simulated) && (
            <div className="flex flex-wrap items-center gap-2 border-t border-line-subtle px-3 py-2">
              {errorMessage && <span className="mr-auto text-xs text-fg-muted">{errorMessage}</span>}
              {errorCta && (
                <Link href={errorCta.href} className={buttonStyles({ size: "sm", variant: "secondary" })}>
                  {errorCta.label}
                </Link>
              )}
              {action.links?.map((l) => (
                <a
                  key={l.href + l.label}
                  href={l.href}
                  target={l.href.startsWith("/") ? undefined : "_blank"}
                  rel="noreferrer"
                  className={buttonStyles({ size: "sm", variant: "ghost" })}
                >
                  {l.label}
                  <ArrowUpRight />
                </a>
              ))}
              {action.simulated && <PreviewTag className="ml-auto" />}
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function StepRow({ step, last }: { step: ActionStep; last: boolean }) {
  return (
    <li className="relative flex gap-3 pb-2.5">
      {!last && <span aria-hidden className="absolute left-[7.5px] top-[18px] h-[calc(100%-14px)] w-px bg-line" />}
      <StepNode state={step.state} />
      <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <span
          className={cn(
            "text-sm",
            step.state === "pending" || step.state === "skipped" ? "text-fg-subtle" : "text-fg",
            step.state === "skipped" && "line-through decoration-fg-faint",
          )}
        >
          {step.label}
        </span>
        {step.detail && (
          <span className={cn("text-xs", step.state === "failed" ? "text-danger" : "text-fg-subtle")}>{step.detail}</span>
        )}
      </div>
      <span className="sr-only">{STEP_LABEL[step.state]}</span>
    </li>
  );
}

const STEP_LABEL: Record<StepState, string> = {
  pending: "Not started",
  running: "In progress",
  done: "Done",
  failed: "Failed",
  skipped: "Skipped",
};

function StepNode({ state }: { state: StepState }) {
  const base = "relative z-10 mt-[2px] grid size-4 shrink-0 place-items-center rounded-full";
  switch (state) {
    case "done":
      return (
        <span className={cn(base, "bg-raised text-fg-muted ring-1 ring-line-strong")}>
          <Check className="size-2.5" strokeWidth={3} />
        </span>
      );
    case "running":
      return (
        <span className={cn(base, "bg-panel ring-1 ring-accent")}>
          <span className="animate-pulse-ring size-1.5 rounded-full bg-accent" />
        </span>
      );
    case "failed":
      return (
        <span className={cn(base, "bg-danger-soft text-danger ring-1 ring-danger/50")}>
          <X className="size-2.5" strokeWidth={3} />
        </span>
      );
    case "skipped":
      return (
        <span className={cn(base, "bg-panel text-fg-faint ring-1 ring-line")}>
          <Minus className="size-2.5" strokeWidth={3} />
        </span>
      );
    default:
      return <span className={cn(base, "bg-panel ring-1 ring-line-strong")} />;
  }
}
