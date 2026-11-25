"use client";

import { useSyncExternalStore } from "react";

/**
 * Minimal reactive store for client data.
 *
 * `seed` runs lazily on the client the first time the store is read, never on the server.
 * During server render and hydration, `use()` returns null so views show their loading skeletons,
 * which is also exactly how they will behave once data comes from the API.
 */
export function createStore<T>(seed: () => T) {
  let state: T | undefined;
  const listeners = new Set<() => void>();

  const get = () => (state ??= seed());

  function set(update: (s: T) => T) {
    state = update(get());
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function use(): T | null {
    return useSyncExternalStore<T | null>(subscribe, get, () => null);
  }

  return { get, set, subscribe, use };
}

let seq = 0;
export const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(seq++).toString(36)}`;
