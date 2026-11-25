"use client";

import { createStore } from "@/lib/data/store";
import { seedConversations } from "./seed";
import type { ActionRun, Conversation, Message } from "./types";

/**
 * Conversation store. Lives at module level, so it survives client-side navigation and resets on reload.
 * PREVIEW: stands in for persisted conversations until the backend exists.
 */
const store = createStore<Conversation[]>(seedConversations);

export const useConversations = store.use;
export const getConversations = store.get;
export const setConversations = store.set;

export function findConversation(id: string) {
  return store.get().find((c) => c.id === id);
}

export function updateConversation(id: string, fn: (c: Conversation) => Conversation) {
  store.set((list) => list.map((c) => (c.id === id ? fn(c) : c)));
}

export function updateMessage(convId: string, msgId: string, fn: (m: Message) => Message) {
  updateConversation(convId, (c) => ({ ...c, messages: c.messages.map((m) => (m.id === msgId ? fn(m) : m)) }));
}

export function updateAction(convId: string, msgId: string, actionId: string, fn: (a: ActionRun) => ActionRun) {
  updateMessage(convId, msgId, (m) => ({
    ...m,
    parts: m.parts.map((p) => (p.type === "action" && p.action.id === actionId ? { ...p, action: fn(p.action) } : p)),
  }));
}

export function deleteConversation(id: string) {
  store.set((list) => list.filter((c) => c.id !== id));
}

export function renameConversation(id: string, title: string) {
  updateConversation(id, (c) => ({ ...c, title }));
}
