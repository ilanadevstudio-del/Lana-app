"use client";

import { CATEGORY_BG } from "@/components/lana/category";
import { IntegrationLogo } from "@/components/lana/integration-logo";
import { cn } from "@/lib/cn";
import { freeSlots, toggleCalendar } from "@/lib/data/calendar";
import type { CalendarEvent, CalendarSource, IntegrationConnection } from "@/lib/data/types";
import { formatDay, formatDuration, formatRelative, formatTime, formatTimeRange } from "@/lib/format";

/** Calendars (with connection state), availability for the focused day, and what's next. */
export function CalendarOverview({
  calendars,
  connections,
  events,
  day,
  now,
  onSelect,
}: {
  calendars: CalendarSource[];
  connections: IntegrationConnection[];
  events: CalendarEvent[];
  day: Date;
  now: Date;
  onSelect: (id: string) => void;
}) {
  const visible = new Set(calendars.filter((c) => c.visible).map((c) => c.id));
  const shown = events.filter((e) => visible.has(e.calendarId));
  // For today, only time that's still ahead is useful.
  const free = freeSlots(shown, day, "09:00", "18:00", 30)
    .filter((s) => s.end > now)
    .map((s) => (s.start < now ? { ...s, start: now } : s))
    .filter((s) => s.end.getTime() - s.start.getTime() >= 15 * 60_000);
  const upcoming = shown
    .filter((e) => !e.allDay && new Date(e.end) > now)
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 5);
  const color = (id: string) => calendars.find((c) => c.id === id)?.color ?? "slate";

  return (
    <div className="flex flex-col">
      <section className="px-4 py-4">
        <h3 className="mb-2 text-xs font-medium text-fg-subtle">Calendars</h3>
        <ul className="flex flex-col gap-0.5">
          {calendars.map((c) => {
            const conn = connections.find((x) => x.integrationId === c.integrationId);
            return (
              <li key={c.id}>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1.5 hover:bg-hover">
                  <input type="checkbox" checked={c.visible} onChange={() => toggleCalendar(c.id)} className="peer sr-only" />
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-3.5 shrink-0 place-items-center rounded-[4px] border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent-line",
                      c.visible ? cn(CATEGORY_BG[c.color], "border-transparent") : "border-line-strong",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-fg">{c.name}</span>
                    <span className="block truncate text-2xs text-fg-subtle">{c.account}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5" title={conn ? `Synced ${formatRelative(conn.lastSyncAt ?? conn.connectedAt)}` : "Managed by LANA"}>
                    <IntegrationLogo id={c.integrationId} size={14} bare />
                    {conn && <span aria-hidden className={cn("size-1.5 rounded-full", conn.status === "connected" ? "bg-success" : "bg-warning")} />}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="border-t border-line-subtle px-4 py-4">
        <h3 className="mb-2 text-xs font-medium text-fg-subtle">Availability · {formatDay(day, now)}</h3>
        {free.length === 0 ? (
          <p className="text-sm text-fg-muted">No free time left between 9 and 6.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {free.map((s) => {
              const mins = Math.round((s.end.getTime() - s.start.getTime()) / 60_000);
              return (
                <li key={s.start.toISOString()} className="flex items-center justify-between rounded-md border border-dashed border-line px-2.5 py-1.5 text-sm">
                  <span className="tabular-nums text-fg">{formatTimeRange(s.start.toISOString(), s.end.toISOString())}</span>
                  <span className="text-xs text-success">Free · {formatDuration(mins)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="border-t border-line-subtle px-4 py-4">
        <h3 className="mb-2 text-xs font-medium text-fg-subtle">Up next</h3>
        <ul className="flex flex-col">
          {upcoming.map((e) => (
            <li key={e.id}>
              <button type="button" onClick={() => onSelect(e.id)} className="flex w-full items-start gap-2.5 rounded-md px-1.5 py-1.5 text-left hover:bg-hover">
                <span aria-hidden className={cn("mt-1 h-7 w-[3px] shrink-0 rounded-full", CATEGORY_BG[color(e.calendarId)])} />
                <span className="min-w-0">
                  <span className="block truncate text-sm text-fg">{e.title}</span>
                  <span className="block text-xs text-fg-subtle">
                    {formatDay(e.start, now)}, {formatTime(e.start)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
