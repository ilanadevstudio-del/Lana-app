import { Badge } from "@/components/ui/badge";
import type { ProjectStatus } from "@/lib/data/types";
import type { Tone } from "@/lib/status";

export const PROJECT_STATUS: Record<ProjectStatus, { label: string; tone: Tone }> = {
  active: { label: "Active", tone: "accent" },
  planning: { label: "Planning", tone: "info" },
  paused: { label: "Paused", tone: "warning" },
  completed: { label: "Completed", tone: "neutral" },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const s = PROJECT_STATUS[status];
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
}

export function ProgressBar({ done, total, className }: { done: number; total: number; className?: string }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className={className} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${done} of ${total} tasks done`}>
      <div className="h-1 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-fg-muted transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
