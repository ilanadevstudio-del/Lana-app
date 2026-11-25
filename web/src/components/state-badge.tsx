import {
  CheckIcon,
  CircleNotchIcon,
  MinusCircleIcon,
  ShieldCheckIcon,
  SparkleIcon,
  WarningIcon,
  XIcon,
} from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { RunState } from "@/lib/assistant/types";

const STATES: Record<RunState, { label: string; color: string; icon: Icon; spin?: boolean }> = {
  understanding: { label: "Understanding", color: "var(--accent)", icon: SparkleIcon },
  planning: { label: "Planning", color: "var(--accent)", icon: SparkleIcon },
  awaiting_approval: { label: "Needs approval", color: "var(--accent)", icon: ShieldCheckIcon },
  executing: { label: "Running", color: "var(--accent)", icon: CircleNotchIcon, spin: true },
  completed: { label: "Completed", color: "var(--success)", icon: CheckIcon },
  failed: { label: "Failed", color: "var(--danger)", icon: XIcon },
  partially_completed: { label: "Partial", color: "var(--warning)", icon: WarningIcon },
  cancelled: { label: "Cancelled", color: "var(--muted)", icon: MinusCircleIcon },
};

export function StateBadge({ state }: { state: RunState }) {
  const { label, color, icon: Glyph, spin } = STATES[state];
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ color, background: `color-mix(in oklab, ${color} 14%, transparent)` }}
    >
      <Glyph size={12} weight="bold" className={spin ? "animate-spin" : undefined} />
      {label}
    </span>
  );
}
