"use client";

import { CATEGORY_BG } from "@/components/lana/category";
import { cn } from "@/lib/cn";
import { eventsOnDay } from "@/lib/data/calendar";
import type { CalendarEvent, CategoryColor } from "@/lib/data/types";
import { addDays, formatTime, isSameDay } from "@/lib/format";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export function MonthGrid({
  month,
  events,
  colorOf,
  now,
  selectedId,
  onSelect,
  onOpenDay,
}: {
  month: Date;
  events: CalendarEvent[];
  colorOf: (calendarId: string) => CategoryColor;
  now: Date;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpenDay: (d: Date) => void;
}) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = startOfWeek(first);
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));

  return (
    <div className="flex h-full min-h-[560px] flex-col">
      <div className="grid shrink-0 grid-cols-7 border-b border-line-subtle">
        {WEEKDAYS.map((w) => (
          <div key={w} className="px-2 py-2 text-2xs font-medium text-fg-subtle">
            {w}
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7 grid-rows-6">
        {days.map((d) => {
          const inMonth = d.getMonth() === month.getMonth();
          const today = isSameDay(d, now);
          const list = eventsOnDay(events, d);
          const shown = list.slice(0, 3);
          return (
            <div
              key={d.toISOString()}
              className={cn("flex min-h-0 min-w-0 flex-col gap-0.5 border-b border-r border-line-subtle p-1 [&:nth-child(7n)]:border-r-0", !inMonth && "bg-panel/40")}
            >
              <button
                type="button"
                onClick={() => onOpenDay(d)}
                aria-label={`Open ${d.toDateString()}`}
                className={cn(
                  "mb-0.5 grid size-6 place-items-center self-start rounded-full text-xs tabular-nums transition-colors hover:bg-hover",
                  today ? "bg-accent font-semibold text-on-accent hover:bg-accent-hover" : inMonth ? "text-fg-muted" : "text-fg-faint",
                )}
              >
                {d.getDate()}
              </button>
              {shown.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onSelect(e.id)}
                  className={cn(
                    "flex min-w-0 items-center gap-1.5 rounded px-1 text-left text-2xs leading-[18px] transition-colors hover:bg-hover",
                    selectedId === e.id && "bg-pressed",
                    !inMonth && "opacity-60",
                  )}
                >
                  <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", CATEGORY_BG[colorOf(e.calendarId)])} />
                  {!e.allDay && <span className="hidden shrink-0 tabular-nums text-fg-subtle lg:inline">{formatTime(e.start)}</span>}
                  <span className="truncate text-fg">{e.title}</span>
                </button>
              ))}
              {list.length > 3 && (
                <button type="button" onClick={() => onOpenDay(d)} className="px-1 text-left text-2xs text-fg-subtle hover:text-fg">
                  +{list.length - 3} more
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
