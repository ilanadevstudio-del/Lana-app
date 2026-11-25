"use client";

import { useSyncExternalStore } from "react";

const MINUTE = 60_000;

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, MINUTE / 2);
  return () => clearInterval(id);
}

// Snapshot is minute-precision so it stays stable between ticks.
const getSnapshot = () => Math.floor(Date.now() / MINUTE) * MINUTE;
const getServerSnapshot = () => null;

/**
 * Current time on the client, refreshed every minute.
 * Returns null during server render, since the server doesn't know the user's clock or time zone.
 */
export function useNow(): Date | null {
  const ms = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return ms === null ? null : new Date(ms);
}
