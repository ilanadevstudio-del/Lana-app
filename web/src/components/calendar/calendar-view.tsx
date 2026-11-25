"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Layers, Plus, X } from "lucide-react";
import { Page, PageHeader, PageToolbar } from "@/components/shell/page";
import { Button, IconButton } from "@/components/ui/button";
import { Segmented } from "@/components/ui/controls";
import { Skeleton } from "@/components/ui/feedback";
import { Popover, PopoverContent, PopoverTrigger, Sheet } from "@/components/ui/overlays";
import { toast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { deleteEvent, restoreEvent, useCalendars, useEvents } from "@/lib/data/calendar";
import { useConnections, useProjects } from "@/lib/data/workspace";
import { addDays, formatLongDate, formatMonthYear, formatShortDate, formatWeekday } from "@/lib/format";
import { setUi, useMediaQuery, useUi } from "@/lib/ui-state";
import { useNow } from "@/lib/use-now";
import { CalendarOverview } from "./calendar-overview";
import { EventDetail } from "./event-detail";
import { EventEditor, type EditorState } from "./event-editor";
import { MonthGrid, startOfWeek } from "./month-grid";
import { WeekGrid } from "./week-grid";

type View = "month" | "week" | "day";

export function CalendarView() {
  const events = useEvents();
  const calendars = useCalendars();
  const connections = useConnections();
  const projects = useProjects();
  const now = useNow();
  const wide = useMediaQuery("(min-width: 1440px)");
  const mobile = useMediaQuery("(max-width: 767px)");
  const [view, setView] = useState<View>("week");
  // Null until the user navigates; follows the client clock (the server has no "today").
  const [cursorState, setCursor] = useState<Date | null>(null);
  const cursor = cursorState ?? now ?? new Date(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);

  // Week columns are too narrow on phones; start them on the day view.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- responsive default, applied once the viewport is known
    if (mobile) setView((v) => (v === "week" ? "day" : v));
  }, [mobile]);

  const newEventRequested = useUi((s) => s.newEventRequested);
  useEffect(() => {
    if (newEventRequested) {
      setUi({ newEventRequested: false });
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot handoff from the command menu
      setEditor({});
    }
  }, [newEventRequested]);

  const step = (dir: number) =>
    setCursor((prev) => {
      const c = prev ?? new Date();
      return view === "month" ? new Date(c.getFullYear(), c.getMonth() + dir, 1) : addDays(c, dir * (view === "week" ? 7 : 1));
    });

  const weekStart = startOfWeek(cursor);
  const label = !now
    ? ""
    : view === "month"
      ? formatMonthYear(cursor)
      : view === "week"
        ? `${formatShortDate(weekStart)} – ${formatShortDate(addDays(weekStart, 6))}, ${addDays(weekStart, 6).getFullYear()}`
        : mobile
          ? `${formatWeekday(cursor)}, ${formatShortDate(cursor)}`
          : formatLongDate(cursor);

  const ready = events && calendars && connections && projects && now;
  const visible = new Set(calendars?.filter((c) => c.visible).map((c) => c.id));
  const shown = events?.filter((e) => visible.has(e.calendarId)) ?? [];
  const colorOf = (id: string) => calendars?.find((c) => c.id === id)?.color ?? "slate";
  const selected = events?.find((e) => e.id === selectedId) ?? null;

  const remove = (id: string) => {
    const removed = deleteEvent(id);
    setSelectedId(null);
    if (removed) toast({ title: "Event deleted", description: removed.title, action: { label: "Undo", onClick: () => restoreEvent(removed) } });
  };

  const detail = selected && calendars && projects && (
    <EventDetail
      event={selected}
      calendar={calendars.find((c) => c.id === selected.calendarId)}
      project={projects.find((p) => p.id === selected.projectId)}
      onEdit={() => setEditor({ event: selected })}
      onDelete={() => remove(selected.id)}
    />
  );
  const overview = ready && (
    <CalendarOverview
      calendars={calendars}
      connections={connections}
      events={events}
      day={view === "day" ? cursor : now}
      now={now}
      onSelect={setSelectedId}
    />
  );

  return (
    <Page>
      <PageHeader
        title="Calendar"
        actions={
          <Button variant="primary" size="sm" icon={<Plus />} onClick={() => setEditor({})}>
            <span className="max-sm:sr-only">New event</span>
          </Button>
        }
      />
      <PageToolbar>
        <Button size="sm" onClick={() => setCursor(null)}>
          Today
        </Button>
        <div className="flex">
          <Tooltip content="Previous">
            <IconButton label="Previous" size="sm" onClick={() => step(-1)}>
              <ChevronLeft />
            </IconButton>
          </Tooltip>
          <Tooltip content="Next">
            <IconButton label="Next" size="sm" onClick={() => step(1)}>
              <ChevronRight />
            </IconButton>
          </Tooltip>
        </div>
        <h2 className="truncate text-sm font-medium text-fg" aria-live="polite">
          {label}
        </h2>
        <div className="ml-auto flex items-center gap-2">
          {!wide && ready && (
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" icon={<Layers />}>
                  <span className="max-sm:sr-only">Calendars</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="max-h-[70dvh] w-72 overflow-y-auto p-0">
                {overview}
              </PopoverContent>
            </Popover>
          )}
          <Segmented
            label="Calendar view"
            size="sm"
            value={view}
            onChange={setView}
            options={[
              { value: "month", label: "Month" },
              { value: "week", label: "Week" },
              { value: "day", label: "Day" },
            ]}
          />
        </div>
      </PageToolbar>

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-auto">
          {!ready ? (
            <div className="flex flex-col gap-2 p-5" role="status" aria-label="Loading calendar">
              <Skeleton className="h-8" />
              <Skeleton className="h-[60dvh]" />
            </div>
          ) : view === "month" ? (
            <MonthGrid
              month={cursor}
              events={shown}
              colorOf={colorOf}
              now={now}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onOpenDay={(d) => {
                setCursor(d);
                setView("day");
              }}
            />
          ) : (
            <WeekGrid
              key={view}
              days={view === "week" ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)) : [cursor]}
              events={shown}
              colorOf={colorOf}
              now={now}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onCreate={(start) => setEditor({ start })}
            />
          )}
        </div>

        {wide && (
          <aside aria-label={selected ? "Event details" : "Calendar overview"} className="flex w-[300px] shrink-0 flex-col border-l border-line-subtle bg-panel">
            {selected ? (
              <>
                <div className="flex h-11 shrink-0 items-center border-b border-line-subtle pl-4 pr-2">
                  <span className="flex-1 text-xs font-medium text-fg-subtle">Event</span>
                  <IconButton label="Close event" size="sm" onClick={() => setSelectedId(null)}>
                    <X />
                  </IconButton>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">{detail}</div>
              </>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto">{overview}</div>
            )}
          </aside>
        )}
      </div>

      {!wide && selected && (
        <Sheet open onOpenChange={(o) => !o && setSelectedId(null)} title="Event">
          {detail}
        </Sheet>
      )}

      {calendars && projects && (
        <EventEditor
          state={editor}
          onClose={() => setEditor(null)}
          calendars={calendars}
          projects={projects}
          onSaved={setSelectedId}
        />
      )}
    </Page>
  );
}
