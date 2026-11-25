"use client";

import { seedMemory } from "@/lib/mock/memory";
import { createStore, uid } from "./store";
import type { MemoryCategory, MemoryItem } from "./types";

/**
 * Memory data source.
 * PREVIEW: sample memories in memory. Deleting here only affects this browser session.
 */
const store = createStore<MemoryItem[]>(seedMemory);
const settings = createStore(() => ({ enabled: true, learnFromIntegrations: true }));

export const useMemory = store.use;
export const useMemorySettings = settings.use;

export const MEMORY_CATEGORIES: { id: MemoryCategory; label: string; description: string }[] = [
  { id: "personal", label: "Personal", description: "Who you are and where you are" },
  { id: "people", label: "People", description: "Who you work and live with" },
  { id: "projects", label: "Projects", description: "Facts about ongoing work" },
  { id: "preferences", label: "Preferences", description: "How you like things done" },
  { id: "commitments", label: "Commitments", description: "Promises and routines" },
  { id: "work", label: "Work context", description: "Tools, accounts and habits" },
];

export function createMemory(input: Pick<MemoryItem, "category" | "title" | "detail">) {
  const now = new Date().toISOString();
  const item: MemoryItem = {
    ...input,
    id: uid("mem"),
    createdAt: now,
    updatedAt: now,
    source: { kind: "manual", label: "Added by you" },
  };
  store.set((list) => [item, ...list]);
  return item;
}

export function updateMemory(id: string, patch: Partial<MemoryItem>) {
  store.set((list) => list.map((m) => (m.id === id ? { ...m, ...patch, updatedAt: new Date().toISOString() } : m)));
}

export function deleteMemory(id: string) {
  const removed = store.get().find((m) => m.id === id);
  store.set((list) => list.filter((m) => m.id !== id));
  return removed;
}

export function restoreMemory(item: MemoryItem) {
  store.set((list) => [item, ...list]);
}

export function setMemoryEnabled(enabled: boolean) {
  settings.set((s) => ({ ...s, enabled }));
}

export function setLearnFromIntegrations(learnFromIntegrations: boolean) {
  settings.set((s) => ({ ...s, learnFromIntegrations }));
}
