import { cn } from "@/lib/cn";

const HUES = [250, 200, 160, 30, 340, 280];

function hueFor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return HUES[h % HUES.length];
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** Initials on a quiet tinted tile. The tint is derived from the name so it's stable. */
export function Avatar({ name, size = 24, className }: { name: string; size?: number; className?: string }) {
  const hue = hueFor(name);
  return (
    <span
      aria-hidden
      className={cn("grid shrink-0 select-none place-items-center rounded-full font-semibold", className)}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, Math.round(size * 0.38)),
        background: `oklch(0.42 0.06 ${hue} / 0.55)`,
        color: `oklch(0.92 0.04 ${hue})`,
      }}
    >
      {initials(name)}
    </span>
  );
}
