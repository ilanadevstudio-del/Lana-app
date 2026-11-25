import { useSyncExternalStore } from "react";
import { SEED_STATE } from "./seed";
import type { ActionRun, AssistantState, Conversation, Message } from "./types";

/**
 * Minimal client store for conversations.
 *
 * Lives at module level, so it survives client-side navigation and resets on reload.
 * This is a stand-in until conversations are persisted in Supabase (FR-003).
 */

let state: AssistantState = SEED_STATE;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getState() {
  return state;
}

export function setState(update: (s: AssistantState) => AssistantState) {
  state = update(state);
  listeners.forEach((l) => l());
}

export function useAssistant(): AssistantState {
  return useSyncExternalStore(subscribe, getState, () => SEED_STATE);
}

// ── Immutable update helpers ──────────────────────────────────────────────────

export function updateConversation(id: string, fn: (c: Conversation) => Conversation) {
  setState((s) => ({
    ...s,
    conversations: s.conversations.map((c) => (c.id === id ? fn(c) : c)),
  }));
}

export function updateMessage(convId: string, msgId: string, fn: (m: Message) => Message) {
  updateConversation(convId, (c) => ({
    ...c,
    messages: c.messages.map((m) => (m.id === msgId ? fn(m) : m)),
  }));
}

export function updateAction(convId: string, msgId: string, actionId: string, fn: (a: ActionRun) => ActionRun) {
  updateMessage(convId, msgId, (m) => ({
    ...m,
    parts: m.parts.map((p) => (p.type === "action" && p.action.id === actionId ? { ...p, action: fn(p.action) } : p)),
  }));
}

export function findConversation(id: string) {
  return state.conversations.find((c) => c.id === id);
}
