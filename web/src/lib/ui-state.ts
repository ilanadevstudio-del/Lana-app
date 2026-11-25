"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * Shell-level UI state (command palette, dialogs, sidebar).
 * Sidebar collapse is mirrored to <html data-sidebar> so CSS applies before hydration.
 */

export const SIDEBAR_STORAGE_KEY = "lana-sidebar";

interface UiState {
  paletteOpen: boolean;
  shortcutsOpen: boolean;
  /** Set by "New task" in the palette; the tasks view consumes it and focuses quick-add. */
  quickAddRequested: boolean;
  /** Set by "New event"; the calendar view consumes it and opens the editor. */
  newEventRequested: boolean;
  /** Task to open in the tasks view's detail panel (set from the command menu). */
  openTaskId: string | null;
}

const INITIAL: UiState = {
  paletteOpen: false,
  shortcutsOpen: false,
  quickAddRequested: false,
  newEventRequested: false,
  openTaskId: null,
};
let state = INITIAL;
const listeners = new Set<() => void>();

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function setUi(patch: Partial<UiState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function getUi() {
  return state;
}

export function useUi<T>(select: (s: UiState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(INITIAL),
  );
}

// ── Sidebar collapse (persisted) ──────────────────────────────────────────────

function subscribeHtml(l: () => void) {
  const o = new MutationObserver(l);
  o.observe(document.documentElement, { attributes: true, attributeFilter: ["data-sidebar"] });
  return () => o.disconnect();
}

export function useSidebarCollapsed() {
  return useSyncExternalStore(
    subscribeHtml,
    () => document.documentElement.dataset.sidebar === "collapsed",
    () => false,
  );
}

export function toggleSidebar() {
  const collapsed = document.documentElement.dataset.sidebar !== "collapsed";
  document.documentElement.dataset.sidebar = collapsed ? "collapsed" : "expanded";
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "collapsed" : "expanded");
  } catch {
    // ignore
  }
}

// ── Media queries ─────────────────────────────────────────────────────────────

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);
  return matches;
}

/** True when focus is in a text field, so single-key shortcuts must not fire. */
export function isTyping(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  return t.isContentEditable || t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT";
}
