import type { LibraryItem } from "@/lib/data/types";
import { formatBytes } from "@/lib/format";

/** "kemi.bello@example.com" → "Kemi"; channels and names are kept as they are. */
export function recipientLabel(to: string): string {
  if (!to.includes("@") || to.startsWith("#")) return to;
  const first = to.split("@")[0].split(/[._-]/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function ago(at: string, now: Date) {
  const min = Math.max(0, Math.round((now.getTime() - new Date(at).getTime()) / 60_000));
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/** The share column of a Library row. */
export function shareSummary(item: LibraryItem, now = new Date()): string {
  if (item.sharing === "never") return "Never shared automatically";
  const last = item.shares[0];
  if (!last) return "Never shared";
  return `Shared ${item.shares.length}× · ${recipientLabel(last.to)}, ${ago(last.at, now)}`;
}

/** File name and size, link without protocol, or the start of the text. */
export function secondaryLine(item: LibraryItem): string {
  if (item.file) return `${item.file.fileName} · ${formatBytes(item.file.size)}`;
  if (item.link) return item.link.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const text = (item.text?.body ?? "").replace(/\s+/g, " ").trim();
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
}

/** How the detail panel previews an item. Files only preview when this session has their bytes. */
export function previewMode(item: LibraryItem): "image" | "pdf" | "sample" | "unsupported" | "link" | "text" {
  if (item.kind === "link") return "link";
  if (item.kind === "text") return "text";
  const f = item.file;
  if (!f?.previewUrl) return "sample";
  if (f.mimeType.startsWith("image/")) return "image";
  if (f.mimeType === "application/pdf") return "pdf";
  return "unsupported";
}
