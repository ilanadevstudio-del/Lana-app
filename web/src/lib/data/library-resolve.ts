import type { LibraryItem } from "./types";

/**
 * Works out which Library item a request means. Never guesses: several matches are returned
 * as candidates for LANA to ask about, and never-share items are reported as blocked.
 */
export type LibraryResolution =
  | { kind: "match"; item: LibraryItem }
  | { kind: "candidates"; items: LibraryItem[] }
  | { kind: "none"; query: string }
  | { kind: "blocked"; item: LibraryItem };

/** Lowercase, no accents, single spaces; a single longer word loses a plural "s" ("photos" → "photo"). */
export function normalizeName(s: string): string {
  const base = s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
  return !base.includes(" ") && base.length > 3 && base.endsWith("s") ? base.slice(0, -1) : base;
}

export function resolveLibraryItem(items: LibraryItem[], query: string): LibraryResolution {
  const q = normalizeName(query);
  const matches = items.filter((i) => [i.name, ...i.aliases].some((n) => normalizeName(n) === q));
  if (matches.length === 0) return { kind: "none", query };
  if (matches.length > 1) return { kind: "candidates", items: matches };
  const item = matches[0];
  return item.sharing === "never" ? { kind: "blocked", item } : { kind: "match", item };
}

/** "Send my CV to x@y.com" → "cv". Stops at "to", "with", "for" or punctuation. */
export function extractLibraryQuery(request: string): string | null {
  const m = request.match(/\bmy\s+(.+?)(?=\s+(?:to|with|for|over|via)\b|[.,!?]|$)/i);
  return m ? m[1].trim().toLowerCase() : null;
}
