"use client";

import { isSameDay } from "@/lib/format";
import { seedEvents } from "@/lib/mock/events";
import { seedCalendars } from "@/lib/mock/workspace";
import { createStore, uid } from "./store";
import type { CalendarEvent, CalendarSource } from "./types";

/**
 * Calendar data source.
 * PREVIEW: sample events in memory. Changes here are not written to Google Calendar.
 */
const events = createStore<CalendarEvent[]>(seedEvents);
const calendars = createStore<CalendarSource[]>(seedCalendars);

export const useEvents = events.use;
export const getEvents = events.get;
export const useCalendars = calendars.use;

export function createEvent(input: Omit<CalendarEvent, "id">) {
  const event = { ...input, id: uid("evt") };
  events.set((list) => [...list, event]);
  return event;
}

export function updateEvent(id: string, patch: Partial<CalendarEvent>) {
  events.set((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));
}

export function deleteEvent(id: string) {
  const removed = events.get().find((e) => e.id === id);
  events.set((list) => list.filter((e) => e.id !== id));
  return removed;
}

export function restoreEvent(event: CalendarEvent) {
  events.set((list) => [...list, event]);
}

export function toggleCalendar(id: string) {
  calendars.set((list) => list.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)));
}

// ── Selectors ─────────────────────────────────────────────────────────────────

export function eventsOnDay(list: CalendarEvent[], day: Date) {
  return list
    .filter((e) => {
      if (e.allDay) {
        const start = new Date(e.start);
        const end = new Date(e.end);
        return day >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) && day < end;
      }
      return isSameDay(e.start, day);
    })
    .sort((a, b) => (a.allDay === b.allDay ? a.start.localeCompare(b.start) : a.allDay ? -1 : 1));
}

/** Free gaps between `from` and `to` (local "HH:mm") on a day, at least `minMinutes` long. */
export function freeSlots(list: CalendarEvent[], day: Date, from = "09:00", to = "18:00", minMinutes = 30) {
  const toDate = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    const d = new Date(day);
    d.setHours(h, m, 0, 0);
    return d;
  };
  const dayStart = toDate(from);
  const dayEnd = toDate(to);
  const busy = eventsOnDay(list, day)
    .filter((e) => !e.allDay)
    .map((e) => [new Date(e.start), new Date(e.end)] as const)
    .sort((a, b) => a[0].getTime() - b[0].getTime());

  const slots: { start: Date; end: Date }[] = [];
  let cursor = dayStart;
  for (const [s, e] of busy) {
    if (s > cursor && (s.getTime() - cursor.getTime()) / 60_000 >= minMinutes) {
      slots.push({ start: cursor, end: s < dayEnd ? s : dayEnd });
    }
    if (e > cursor) cursor = e;
    if (cursor >= dayEnd) break;
  }
  if (cursor < dayEnd && (dayEnd.getTime() - cursor.getTime()) / 60_000 >= minMinutes) {
    slots.push({ start: cursor, end: dayEnd });
  }
  return slots.filter((s) => s.end > s.start);
}
