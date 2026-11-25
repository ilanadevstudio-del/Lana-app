"use client";

import { useSyncExternalStore } from "react";

const MINUTE = 60_000;

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, MINUTE / 2);
  return () => clearInterval(id);
}

// Minute precision keeps the snapshot stable between ticks.
const getSnapshot = () => Math.floor(Date.now() / MINUTE) * MINUTE;
const getServerSnapshot = () => null;

/**
 * Current time on the client, refreshed every minute.
 * Null during server render: the server doesn't know the viewer's clock or time zone.
 */
export function useNow(): Date | null {
  const ms = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return ms === null ? null : new Date(ms);
}
