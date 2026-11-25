import { normalizeName } from "./library-resolve";
import type { LibraryItem, LibraryItemKind } from "./types";

export const MAX_LIBRARY_FILE_BYTES = 10 * 1024 * 1024;

export interface LibraryDraft {
  kind: LibraryItemKind;
  name: string;
  aliases: string[];
  sharing: "ask" | "never";
  url?: string;
  text?: string;
  file?: { name: string; size: number; type: string };
}

export interface DraftValidation {
  errors: Partial<Record<"name" | "url" | "text" | "file", string>>;
  /** Names on this draft that another item already answers to. A warning, not an error: LANA will ask. */
  aliasConflicts: { alias: string; itemName: string }[];
}

/** "emmanuelola.dev" → "https://emmanuelola.dev"; null when it can't be a web link. */
export function normalizeUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw || /\s/.test(raw)) return null;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withProtocol);
    return url.hostname.includes(".") ? withProtocol : null;
  } catch {
    return null;
  }
}

/** Validates the add/edit form. `editingId` is the item being edited, which never conflicts with itself. */
export function validateLibraryDraft(draft: LibraryDraft, existing: LibraryItem[], editingId?: string): DraftValidation {
  const errors: DraftValidation["errors"] = {};
  if (!draft.name.trim()) errors.name = "Give it a name.";
  if (draft.kind === "link" && !normalizeUrl(draft.url ?? "")) errors.url = "Enter a valid link.";
  if (draft.kind === "text" && !draft.text?.trim()) errors.text = "Add the text to share.";
  if (draft.kind === "file") {
    if (draft.file && draft.file.size > MAX_LIBRARY_FILE_BYTES) errors.file = "Files can be up to 10 MB.";
    else if (!draft.file && !editingId) errors.file = "Choose a file.";
  }

  const aliasConflicts: DraftValidation["aliasConflicts"] = [];
  for (const alias of [draft.name, ...draft.aliases].filter((a) => a.trim())) {
    const n = normalizeName(alias);
    const other = existing.find((i) => i.id !== editingId && [i.name, ...i.aliases].some((x) => normalizeName(x) === n));
    if (other) aliasConflicts.push({ alias: alias.trim(), itemName: other.name });
  }
  return { errors, aliasConflicts };
}
