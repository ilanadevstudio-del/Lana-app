import { BRAND_MARKS } from "@/lib/brand-marks";
import { cn } from "@/lib/cn";
import { integrationName } from "@/lib/data/integration-catalog";
import type { IntegrationId } from "@/lib/data/types";
import { LanaMark } from "./logo";

/** Near-black brand colours would vanish on the dark canvas, so they use the foreground colour instead. */
function isDark(hex: string) {
  const n = parseInt(hex, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 70;
}

const FALLBACK_COLORS: Partial<Record<IntegrationId, string>> = { slack: "#E01E5A" };

/**
 * Integration logo on a neutral tile. `size` is the tile size; the mark is ~55% of it.
 * Integrations without a brand mark fall back to a monogram.
 */
export function IntegrationLogo({
  id,
  size = 28,
  className,
  bare,
}: {
  id: IntegrationId;
  size?: number;
  className?: string;
  /** Render just the mark without a tile (for inline use in text rows). */
  bare?: boolean;
}) {
  if (id === "lana") {
    return <LanaMark size={bare ? size : size} className={className} />;
  }
  const mark = BRAND_MARKS[id];
  const name = integrationName(id);
  const markSize = bare ? size : Math.round(size * 0.55);
  const color = mark ? (isDark(mark.hex) ? "var(--fg)" : `#${mark.hex}`) : (FALLBACK_COLORS[id] ?? "var(--fg-muted)");

  const glyph = mark ? (
    <svg width={markSize} height={markSize} viewBox="0 0 24 24" aria-hidden fill={color}>
      <path d={mark.path} />
    </svg>
  ) : (
    <span aria-hidden className="font-semibold leading-none" style={{ color, fontSize: Math.round(size * 0.42) }}>
      {name.slice(0, 1)}
    </span>
  );

  if (bare) return <span className={cn("inline-grid shrink-0 place-items-center", className)}>{glyph}</span>;

  return (
    <span
      className={cn("grid shrink-0 place-items-center border border-line bg-raised", className)}
      style={{ width: size, height: size, borderRadius: Math.max(5, Math.round(size * 0.24)) }}
    >
      {glyph}
    </span>
  );
}
