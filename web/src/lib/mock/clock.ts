import { addDays, startOfDay, toDateKey } from "@/lib/format";

/**
 * Sample data is generated relative to the moment it's first read,
 * so the preview always shows a believable "today" instead of a frozen date.
 */

/** ISO timestamp `days` from today at a local "HH:mm" time. */
export function at(days: number, time: string) {
  const [h, m] = time.split(":").map(Number);
  const d = addDays(startOfDay(new Date()), days);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export function minutesAgo(min: number) {
  return new Date(Date.now() - min * 60_000).toISOString();
}

export function hoursAgo(h: number) {
  return minutesAgo(h * 60);
}

export function daysAgo(d: number, time = "10:00") {
  return at(-d, time);
}

/** Local date key `days` from today. */
export function day(days: number) {
  return toDateKey(addDays(new Date(), days));
}
