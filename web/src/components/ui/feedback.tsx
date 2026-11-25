import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-skeleton rounded-md bg-hover", className)} />;
}

/** A stack of row skeletons for list views. */
export function ListSkeleton({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <div role="status" aria-label="Loading" className={cn("flex flex-col", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex h-11 items-center gap-3 border-b border-line-subtle px-1">
          <Skeleton className="size-4 rounded-full" />
          <div style={{ width: `${40 + ((i * 17) % 35)}%` }}>
            <Skeleton className="h-3" />
          </div>
          <Skeleton className="ml-auto h-3 w-14" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 px-4 py-8" : "gap-3 px-6 py-16",
        className,
      )}
    >
      {icon && (
        <div className="grid size-10 place-items-center rounded-lg border border-line bg-panel text-fg-subtle [&_svg]:size-[18px]">
          {icon}
        </div>
      )}
      <div className="max-w-sm">
        <p className="text-sm font-medium text-fg">{title}</p>
        {description && <p className="mt-1 text-sm text-fg-subtle">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  action,
  className,
}: {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn("flex items-start gap-3 rounded-lg border border-danger/25 bg-danger-soft px-3.5 py-3", className)}
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-fg">{title}</p>
        {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Inline note for non-critical context, e.g. preview-mode disclaimers. */
export function Callout({
  icon,
  children,
  tone = "neutral",
  className,
  action,
}: {
  icon?: ReactNode;
  children: ReactNode;
  tone?: "neutral" | "warning" | "accent";
  className?: string;
  action?: ReactNode;
}) {
  const tones = {
    neutral: "border-line bg-panel text-fg-muted",
    warning: "border-warning/25 bg-warning-soft text-fg",
    accent: "border-accent-line/50 bg-accent-soft text-fg",
  };
  return (
    <div className={cn("flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm", tones[tone], className)}>
      {icon && (
        <span
          className={cn(
            "shrink-0 [&_svg]:size-4",
            tone === "warning" ? "text-warning" : tone === "accent" ? "text-accent-text" : "text-fg-subtle",
          )}
        >
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
}
