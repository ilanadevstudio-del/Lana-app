import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Project } from "@/lib/data/types";
import { CATEGORY_BG } from "./category";

/** Square project tile with its short key. */
export function ProjectTile({ project, size = 28, className }: { project: Project; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("relative grid shrink-0 place-items-center overflow-hidden border border-line bg-raised font-semibold text-fg-muted", className)}
      style={{ width: size, height: size, borderRadius: Math.max(5, size * 0.24), fontSize: Math.max(9, Math.round(size * 0.34)) }}
    >
      <span className={cn("absolute inset-x-0 bottom-0 h-[2px]", CATEGORY_BG[project.color])} />
      {project.key}
    </span>
  );
}

/** Inline project reference: colour dot + name. */
export function ProjectChip({ project, link, className }: { project: Project; link?: boolean; className?: string }) {
  const inner = (
    <>
      <span aria-hidden className={cn("size-2 shrink-0 rounded-[3px]", CATEGORY_BG[project.color])} />
      <span className="truncate">{project.name}</span>
    </>
  );
  const cls = cn("inline-flex min-w-0 items-center gap-1.5 text-xs text-fg-muted", className);
  return link ? (
    <Link href={`/projects/${project.id}`} className={cn(cls, "hover:text-fg")} onClick={(e) => e.stopPropagation()}>
      {inner}
    </Link>
  ) : (
    <span className={cls}>{inner}</span>
  );
}
