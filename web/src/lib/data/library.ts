"use client";

import { seedLibrary } from "@/lib/mock/library";
import { resolveLibraryItem, type LibraryResolution } from "./library-resolve";
import { createStore, uid } from "./store";
import type { LibraryItem, LibraryShare } from "./types";

/**
 * Library data source.
 * PREVIEW: sample items in memory; uploads are object URLs that last until reload.
 * Replace these calls with storage/API requests when the backend lands.
 */
const store = createStore<LibraryItem[]>(seedLibrary);

export const useLibrary = store.use;
export const getLibrary = store.get;

export const MAX_LIBRARY_FILE_BYTES = 10 * 1024 * 1024;
/** How long a deleted item can be restored before its preview URL is released. */
const UNDO_WINDOW_MS = 7000;

export type NewLibraryItem = Pick<LibraryItem, "kind" | "name" | "aliases" | "sharing" | "description" | "file" | "link" | "text">;

const now = () => new Date().toISOString();
const revoke = (url?: string) => url && URL.revokeObjectURL(url);
const pendingRevokes = new Map<string, ReturnType<typeof setTimeout>>();

export function createLibraryItem(input: NewLibraryItem): LibraryItem {
  const item: LibraryItem = { ...input, id: uid("lib"), shares: [], createdAt: now(), updatedAt: now() };
  store.set((list) => [item, ...list]);
  return item;
}

export function updateLibraryItem(id: string, patch: Partial<Omit<LibraryItem, "id" | "createdAt">>) {
  store.set((list) => list.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: now() } : i)));
}

export function replaceLibraryFile(id: string, file: NonNullable<LibraryItem["file"]>) {
  const old = store.get().find((i) => i.id === id)?.file;
  store.set((list) =>
    list.map((i) =>
      i.id === id
        ? {
            ...i,
            file,
            versions: old ? [{ id: uid("ver"), fileName: old.fileName, size: old.size, replacedAt: now() }, ...(i.versions ?? [])] : i.versions,
            updatedAt: now(),
          }
        : i,
    ),
  );
  revoke(old?.previewUrl);
}

export function deleteLibraryItem(id: string): LibraryItem | undefined {
  const removed = store.get().find((i) => i.id === id);
  if (!removed) return undefined;
  store.set((list) => list.filter((i) => i.id !== id));
  const url = removed.file?.previewUrl;
  if (url) pendingRevokes.set(id, setTimeout(() => (pendingRevokes.delete(id), revoke(url)), UNDO_WINDOW_MS));
  return removed;
}

export function restoreLibraryItem(item: LibraryItem) {
  clearTimeout(pendingRevokes.get(item.id));
  pendingRevokes.delete(item.id);
  store.set((list) => [item, ...list.filter((i) => i.id !== item.id)]);
}

export function recordShare(id: string, share: LibraryShare) {
  store.set((list) => list.map((i) => (i.id === id ? { ...i, shares: [share, ...i.shares] } : i)));
}

export function resolveFromLibrary(query: string): LibraryResolution {
  return resolveLibraryItem(store.get(), query);
}
