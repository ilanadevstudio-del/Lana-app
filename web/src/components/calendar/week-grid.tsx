"use client";

import { useEffect, useRef } from "react";
import { Video } from "lucide-react";
import { CATEGORY_BG, CATEGORY_SOFT, CATEGORY_TEXT } from "@/components/lana/category";
import { cn } from "@/lib/cn";
import { eventsOnDay } from "@/lib/data/calendar";
import type { CalendarEvent, CategoryColor } from "@/lib/data/types";
import { formatTime, formatWeekday, isSameDay } from "@/lib/format";

const HOUR = 48;
const HOUR_LABEL = new Intl.DateTimeFormat(undefined, { hour: "numeric" });

interface Placed {
  event: CalendarEvent;
  top: number;
  height: number;
  col: number;
  cols: number;
}

/** Lays out overlapping events side by side within each cluster of overlaps. */
function layoutDay(events: CalendarEvent[], day: Date): Placed[] {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const items = events
    .filter((e) => !e.allDay)
    .map((e) => {
      const s = Math.max(0, (new Date(e.start).getTime() - dayStart.getTime()) / 60_000);
      const en = Math.min(24 * 60, (new Date(e.end).getTime() - dayStart.getTime()) / 60_000);
      return { event: e, s, en: Math.max(en, s + 15) };
    })
    .sort((a, b) => a.s - b.s || b.en - a.en);

  const placed: Placed[] = [];
  let cluster: (typeof items[number] & { col: number })[] = [];
  let clusterEnd = -1;
  const flush = () => {
    const cols = Math.max(1, ...cluster.map((c) => c.col + 1));
    for (const c of cluster) placed.push({ event: c.event, top: (c.s / 60) * HOUR, height: Math.max(((c.en - c.s) / 60) * HOUR - 2, 18), col: c.col, cols });
    cluster = [];
  };
  for (const it of items) {
    if (it.s >= clusterEnd && cluster.length) flush();
    const used = new Set(cluster.filter((c) => c.en > it.s).map((c) => c.col));
    let col = 0;
    while (used.has(col)) col++;
    cluster.push({ ...it, col });
    clusterEnd = Math.max(clusterEnd, it.en);
  }
  if (cluster.length) flush();
  return placed;
}

export function WeekGrid({
  days,
  events,
  colorOf,
  now,
  selectedId,
  onSelect,
  onCreate,
}: {
  days: Date[];
  events: CalendarEvent[];
  colorOf: (calendarId: string) => CategoryColor;
  now: Date;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (start: Date) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Open around the working day rather than midnight.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = HOUR * 7.5;
  }, []);

  const allDay = days.map((d) => eventsOnDay(events, d).filter((e) => e.allDay));
  const hasAllDay = allDay.some((a) => a.length > 0);
  const cols = { gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Day headers */}
      <div className="grid shrink-0 border-b border-line-subtle" style={cols}>
        <div />
        {days.map((d) => {
          const today = isSameDay(d, now);
          return (
            <div key={d.toISOString()} className="flex h-11 items-center justify-center gap-1.5 border-l border-line-subtle text-xs">
              <span className={today ? "text-accent-text" : "text-fg-subtle"}>{formatWeekday(d)}</span>
              <span
                className={cn(
                  "grid size-6 place-items-center rounded-full text-sm font-medium tabular-nums",
                  today ? "bg-accent text-on-accent" : "text-fg",
                )}
              >
                {d.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {hasAllDay && (
        <div className="grid shrink-0 border-b border-line-subtle" style={cols}>
          <div className="flex items-center justify-end pr-2 text-2xs text-fg-faint">All day</div>
          {allDay.map((list, i) => (
            <div key={i} className="flex min-w-0 flex-col gap-0.5 border-l border-line-subtle p-1">
              {list.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onSelect(e.id)}
                  className={cn(
                    "truncate rounded px-1.5 text-left text-xs font-medium leading-5",
                    CATEGORY_SOFT[colorOf(e.calendarId)],
                    selectedId === e.id && "ring-1 ring-fg-muted",
                  )}
                >
                  {e.title}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Hour grid */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="relative grid" style={{ ...cols, height: HOUR * 24 }}>
          <div className="relative">
            {Array.from({ length: 23 }, (_, h) => (
              <span key={h} className="absolute right-2 -translate-y-1/2 text-2xs tabular-nums text-fg-faint" style={{ top: (h + 1) * HOUR }}>
                {HOUR_LABEL.format(new Date(2000, 0, 1, h + 1))}
              </span>
            ))}
          </div>
          {days.map((d) => {
            const placed = layoutDay(eventsOnDay(events, d), d);
            const today = isSameDay(d, now);
            const nowTop = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR;
            return (
              <div
                key={d.toISOString()}
                className={cn("relative border-l border-line-subtle", today && "bg-accent-soft/[0.15]")}
                style={{ backgroundImage: `repeating-linear-gradient(to bottom, var(--line-subtle) 0 1px, transparent 1px ${HOUR}px)` }}
                onClick={(e) => {
                  if (e.target !== e.currentTarget) return;
                  const y = e.nativeEvent.offsetY;
                  const minutes = Math.floor((y / HOUR) * 2) * 30;
                  const start = new Date(d);
                  start.setHours(0, minutes, 0, 0);
                  onCreate(start);
                }}
              >
                {placed.map(({ event: e, top, height, col, cols: n }) => {
                  const color = colorOf(e.calendarId);
                  const past = new Date(e.end) < now;
                  const short = height < 30;
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => onSelect(e.id)}
                      className={cn(
                        "absolute flex overflow-hidden rounded-md pl-2.5 pr-1.5 text-left transition-colors",
                        short ? "items-center gap-1.5" : "flex-col py-1",
                        CATEGORY_SOFT[color],
                        selectedId === e.id && "ring-1 ring-fg-muted",
                        past && "opacity-60",
                      )}
                      style={{ top, height, left: `calc(${(col / n) * 100}% + 2px)`, width: `calc(${100 / n}% - 4px)` }}
                    >
                      <span aria-hidden className={cn("absolute inset-y-1 left-1 w-[3px] rounded-full", CATEGORY_BG[color])} />
                      <span className={cn("truncate font-medium leading-4 text-fg", short ? "text-2xs" : "text-xs")}>{e.title}</span>
                      {height > 32 && (
                        <span className={cn("flex items-center gap-1 truncate text-2xs leading-4", CATEGORY_TEXT[color])}>
                          {formatTime(e.start)}
                          {e.videoUrl && <Video className="size-3" />}
                        </span>
                      )}
                    </button>
                  );
                })}
                {today && (
                  <div aria-hidden className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ top: nowTop }}>
                    <span className="-ml-1 size-2 rounded-full bg-danger" />
                    <span className="h-px flex-1 bg-danger" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
