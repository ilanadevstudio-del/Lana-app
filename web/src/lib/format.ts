/**
 * Date and time formatting. All data uses ISO strings; formatting happens here, in the viewer's locale.
 */

const DAY = 86_400_000;

export function startOfDay(d: Date | number | string) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function isSameDay(a: Date | string, b: Date | string) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

/** Whole days from today to `d` (negative = past). */
export function dayDiff(d: Date | string, now = new Date()) {
  return Math.round((startOfDay(d).getTime() - startOfDay(now).getTime()) / DAY);
}

/** ISO date (yyyy-mm-dd) in local time. */
export function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const weekdayFmt = new Intl.DateTimeFormat(undefined, { weekday: "short" });
const longWeekdayFmt = new Intl.DateTimeFormat(undefined, { weekday: "long" });
const shortDateFmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const longDateFmt = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" });
const monthYearFmt = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });

export const formatTime = (d: Date | string) => timeFmt.format(new Date(d));
export const formatWeekday = (d: Date | string) => weekdayFmt.format(new Date(d));
export const formatLongWeekday = (d: Date | string) => longWeekdayFmt.format(new Date(d));
export const formatShortDate = (d: Date | string) => shortDateFmt.format(new Date(d));
export const formatLongDate = (d: Date | string) => longDateFmt.format(new Date(d));
export const formatMonthYear = (d: Date | string) => monthYearFmt.format(new Date(d));

export function formatTimeRange(start: string, end: string) {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

/** "Today", "Tomorrow", "Yesterday", weekday within a week, else "Mar 4". */
export function formatDay(d: Date | string, now = new Date()) {
  const diff = dayDiff(d, now);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff < 7) return formatLongWeekday(d);
  return formatShortDate(d);
}

/** formatDay for use mid-sentence: "today", "tomorrow", but "Friday" and "Mar 4" keep their capitals. */
export function formatDayInline(d: Date | string, now = new Date()) {
  const s = formatDay(d, now);
  return Math.abs(dayDiff(d, now)) <= 1 ? s.toLowerCase() : s;
}

/** Compact relative time: "now", "4m", "2h", "Yesterday", "Mar 4". */
export function formatRelative(d: Date | string, now = new Date()) {
  const ms = now.getTime() - new Date(d).getTime();
  const future = ms < 0;
  const abs = Math.abs(ms);
  const min = Math.round(abs / 60_000);
  if (min < 1) return "Just now";
  if (min < 60) return future ? `in ${min}m` : `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24 && isSameDay(d, now)) return future ? `in ${h}h` : `${h}h ago`;
  return `${formatDay(d, now)}${future || dayDiff(d, now) >= -1 ? `, ${formatTime(d)}` : ""}`;
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function greeting(now: Date) {
  const h = now.getHours();
  if (h < 5) return "Good evening";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function plural(n: number, word: string, pluralWord = `${word}s`) {
  return `${n} ${n === 1 ? word : pluralWord}`;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
