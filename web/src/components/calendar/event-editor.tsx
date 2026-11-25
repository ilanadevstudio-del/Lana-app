"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/controls";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Dialog } from "@/components/ui/overlays";
import { toast } from "@/components/ui/toast";
import { createEvent, updateEvent } from "@/lib/data/calendar";
import type { CalendarEvent, CalendarSource, Project } from "@/lib/data/types";
import { addDays, fromDateKey, toDateKey } from "@/lib/format";

export interface EditorState {
  event?: CalendarEvent;
  start?: Date;
}

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

function initial(state: EditorState, calendars: CalendarSource[]) {
  const e = state.event;
  const start = e ? new Date(e.start) : (state.start ?? nextHalfHour());
  const end = e ? new Date(e.end) : new Date(start.getTime() + 30 * 60_000);
  return {
    title: e?.title ?? "",
    calendarId: e?.calendarId ?? calendars[0]?.id ?? "",
    date: toDateKey(start),
    start: hhmm(start),
    end: hhmm(end),
    allDay: e?.allDay ?? false,
    location: e?.location ?? "",
    description: e?.description ?? "",
    projectId: e?.projectId ?? "",
  };
}

function nextHalfHour() {
  const d = new Date();
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0);
  return d;
}

/** Create or edit an event. Validates required fields and time order before saving. */
export function EventEditor({
  state,
  onClose,
  calendars,
  projects,
  onSaved,
}: {
  state: EditorState | null;
  onClose: () => void;
  calendars: CalendarSource[];
  projects: Project[];
  onSaved: (id: string) => void;
}) {
  return (
    <Dialog
      open={!!state}
      onOpenChange={(o) => !o && onClose()}
      title={state?.event ? "Edit event" : "New event"}
      description="Preview: saved to sample data only. Nothing is written to Google Calendar."
    >
      {state && <EditorForm key={state.event?.id ?? state.start?.toISOString() ?? "new"} state={state} calendars={calendars} projects={projects} onClose={onClose} onSaved={onSaved} />}
    </Dialog>
  );
}

function EditorForm({
  state,
  calendars,
  projects,
  onClose,
  onSaved,
}: {
  state: EditorState;
  calendars: CalendarSource[];
  projects: Project[];
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const [f, setF] = useState(() => initial(state, calendars));
  const [submitted, setSubmitted] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  const errors = {
    title: !f.title.trim() ? "Give the event a title." : undefined,
    end: !f.allDay && f.end <= f.start ? "End time must be after the start." : undefined,
  };
  const valid = !errors.title && !errors.end;

  function save() {
    setSubmitted(true);
    if (!valid) return;
    const day = fromDateKey(f.date);
    const at = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      const d = new Date(day);
      d.setHours(h, m, 0, 0);
      return d.toISOString();
    };
    const data = {
      title: f.title.trim(),
      calendarId: f.calendarId,
      start: f.allDay ? day.toISOString() : at(f.start),
      end: f.allDay ? addDays(day, 1).toISOString() : at(f.end),
      allDay: f.allDay || undefined,
      location: f.location.trim() || undefined,
      description: f.description.trim() || undefined,
      projectId: f.projectId || undefined,
    };
    if (state.event) {
      updateEvent(state.event.id, data);
      onSaved(state.event.id);
      toast({ title: "Event updated", tone: "success" });
    } else {
      const created = createEvent(data);
      onSaved(created.id);
      toast({ title: "Event created", description: data.title, tone: "success" });
    }
    onClose();
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="flex flex-col gap-4 pb-2"
    >
      <Field label="Title" error={submitted ? errors.title : undefined}>
        {(p) => <Input {...p} autoFocus value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Sponsor dashboard demo" />}
      </Field>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field label="Date">
          {(p) => <Input {...p} type="date" value={f.date} onChange={(e) => set("date", e.target.value)} />}
        </Field>
        <label className="flex h-8 items-center gap-2 text-sm text-fg-muted">
          <Switch checked={f.allDay} onCheckedChange={(v) => set("allDay", v)} label="All day" />
          All day
        </label>
      </div>
      {!f.allDay && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Starts">{(p) => <Input {...p} type="time" value={f.start} onChange={(e) => set("start", e.target.value)} />}</Field>
          <Field label="Ends" error={submitted ? errors.end : undefined}>
            {(p) => <Input {...p} type="time" value={f.end} onChange={(e) => set("end", e.target.value)} />}
          </Field>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Calendar">
          {(p) => (
            <Select {...p} value={f.calendarId} onChange={(e) => set("calendarId", e.target.value)}>
              {calendars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Project" optional>
          {(p) => (
            <Select {...p} value={f.projectId} onChange={(e) => set("projectId", e.target.value)}>
              <option value="">None</option>
              {projects.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <Field label="Location" optional>
        {(p) => <Input {...p} value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="Address or meeting link" />}
      </Field>
      <Field label="Description" optional>
        {(p) => <Textarea {...p} value={f.description} onChange={(e) => set("description", e.target.value)} rows={3} />}
      </Field>
      <div className="-mx-5 mt-1 flex justify-end gap-2 border-t border-line-subtle px-5 pt-3">
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary">
          {state.event ? "Save changes" : "Create event"}
        </Button>
      </div>
    </form>
  );
}
