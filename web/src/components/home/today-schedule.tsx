"use client";

import { MapPin, Video } from "lucide-react";
import { EmptyState, ListSkeleton } from "@/components/ui/feedback";
import { CATEGORY_BG } from "@/components/lana/category";
import { cn } from "@/lib/cn";
import { eventsOnDay, freeSlots, useCalendars, useEvents } from "@/lib/data/calendar";
import type { CalendarEvent } from "@/lib/data/types";
import { formatDuration, formatTime } from "@/lib/format";
import { useNow } from "@/lib/use-now";
import { Panel } from "./panel";

type Row = { kind: "event"; event: CalendarEvent } | { kind: "free"; start: Date; end: Date };

/** Today's agenda, with free time shown between events so availability is readable at a glance. */
export function TodaySchedule() {
  const now = useNow();
  const events = useEvents();
  const calendars = useCalendars();

  if (!now || !events || !calendars) {
    return (
      <Panel title="Today" href="/calendar" hrefLabel="Calendar">
        <ListSkeleton rows={5} className="px-3" />
      </Panel>
    );
  }

  const visible = new Set(calendars.filter((c) => c.visible).map((c) => c.id));
  const color = (id: string) => calendars.find((c) => c.id === id)?.color ?? "slate";
  const today = eventsOnDay(events, now).filter((e) => visible.has(e.calendarId));
  const timed = today.filter((e) => !e.allDay);
  const free = freeSlots(events, now, "09:00", "19:00", 45).filter((s) => s.end > now);

  const rows: Row[] = [
    ...timed.map((event) => ({ kind: "event" as const, event })),
    ...free.map((s) => ({ kind: "free" as const, start: s.start, end: s.end })),
  ].sort((a, b) => (a.kind === "event" ? new Date(a.event.start) : a.start).getTime() - (b.kind === "event" ? new Date(b.event.start) : b.start).getTime());

  return (
    <Panel title="Today" href="/calendar" hrefLabel="Calendar" meta={<span className="text-xs text-fg-faint">{timed.length} events</span>}>
      {today.length === 0 ? (
        <EmptyState compact title="Nothing scheduled today" description="Your calendar is clear. A good day for deep work." />
      ) : (
        <ol className="py-1.5">
          {rows.map((r) => {
            if (r.kind === "free") {
              const mins = Math.round((r.end.getTime() - Math.max(r.start.getTime(), now.getTime())) / 60_000);
              return (
                <li key={`free-${r.start.toISOString()}`} className="flex items-center gap-3 px-3.5 py-1.5">
                  <span className="w-[62px] shrink-0 text-right text-xs tabular-nums text-fg-faint">
                    {formatTime(r.start > now ? r.start : now)}
                  </span>
                  <span className="h-px flex-1 border-t border-dashed border-line" />
                  <span className="text-xs text-fg-subtle">Free · {formatDuration(Math.max(mins, 0))}</span>
                </li>
              );
            }
            const e = r.event;
            const past = new Date(e.end) < now;
            const live = new Date(e.start) <= now && new Date(e.end) > now;
            return (
              <li key={e.id} className={cn("flex items-stretch gap-3 px-3.5 py-1.5", past && "opacity-50")}>
                <span className="w-[62px] shrink-0 pt-0.5 text-right text-xs tabular-nums text-fg-subtle">{formatTime(e.start)}</span>
                <span className={cn("w-[3px] shrink-0 rounded-full", CATEGORY_BG[color(e.calendarId)])} />
                <div className="min-w-0 flex-1 py-px">
                  <p className="flex items-center gap-2 truncate text-sm font-medium text-fg">
                    <span className="truncate">{e.title}</span>
                    {live && <span className="shrink-0 rounded bg-accent-soft px-1.5 text-2xs font-medium leading-[18px] text-accent-text">Now</span>}
                  </p>
                  <p className="flex items-center gap-1.5 truncate text-xs text-fg-subtle">
                    {formatTime(e.start)} – {formatTime(e.end)}
                    {e.videoUrl && (
                      <>
                        <span aria-hidden>·</span>
                        <Video className="size-3" /> Video call
                      </>
                    )}
                    {e.location && (
                      <>
                        <span aria-hidden>·</span>
                        <MapPin className="size-3" />
                        <span className="truncate">{e.location}</span>
                      </>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
