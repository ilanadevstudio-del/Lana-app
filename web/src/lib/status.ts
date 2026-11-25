import type { ActionStatus } from "@/lib/data/types";

export type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

/**
 * The single source of truth for how action states look and read.
 * Only "succeeded" uses the solid success treatment; "unverified" is deliberately weaker.
 */
export const ACTION_STATUS: Record<ActionStatus, { label: string; tone: Tone; description: string }> = {
  proposed: { label: "Proposed", tone: "neutral", description: "LANA suggested this action. Nothing has run." },
  awaiting_approval: { label: "Needs approval", tone: "warning", description: "Waiting for you to approve or decline." },
  scheduled: { label: "Scheduled", tone: "info", description: "Will run automatically at the scheduled time." },
  executing: { label: "Running", tone: "accent", description: "LANA is carrying this out now." },
  succeeded: { label: "Succeeded", tone: "success", description: "Completed and confirmed by the service." },
  unverified: {
    label: "Unverified",
    tone: "neutral",
    description: "The request was made, but the service didn't confirm the result.",
  },
  partially_completed: { label: "Partial", tone: "warning", description: "Some steps finished; others failed." },
  failed: { label: "Failed", tone: "danger", description: "Nothing was changed, or the change didn't go through." },
  cancelled: { label: "Cancelled", tone: "neutral", description: "Declined or stopped before it finished." },
};

export const TONE_TEXT: Record<Tone, string> = {
  neutral: "text-fg-muted",
  accent: "text-accent-text",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
};

export const TONE_BG: Record<Tone, string> = {
  neutral: "bg-hover",
  accent: "bg-accent-soft",
  success: "bg-success-soft",
  warning: "bg-warning-soft",
  danger: "bg-danger-soft",
  info: "bg-info-soft",
};

export const TONE_DOT: Record<Tone, string> = {
  neutral: "bg-fg-subtle",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};
