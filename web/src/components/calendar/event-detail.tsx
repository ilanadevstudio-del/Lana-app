"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AlignLeft, CalendarDays, ExternalLink, MapPin, Pencil, Trash2, Users, Video } from "lucide-react";
import { CATEGORY_BG } from "@/components/lana/category";
import { IntegrationLogo } from "@/components/lana/integration-logo";
import { ProjectChip } from "@/components/lana/project-chip";
import { Avatar } from "@/components/ui/avatar";
import { PreviewTag } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { CalendarEvent, CalendarSource, Project } from "@/lib/data/types";
import { formatDay, formatDuration, formatLongDate, formatTimeRange } from "@/lib/format";

export function EventDetail({
  event,
  calendar,
  project,
  onEdit,
  onDelete,
}: {
  event: CalendarEvent;
  calendar?: CalendarSource;
  project?: Project;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const minutes = Math.round((new Date(event.end).getTime() - new Date(event.start).getTime()) / 60_000);
  return (
    <div className="flex flex-col">
      <div className="px-4 pb-4 pt-4">
        <div className="flex items-start gap-2.5">
          {calendar && <span aria-hidden className={cn("mt-1.5 size-2.5 shrink-0 rounded-[3px]", CATEGORY_BG[calendar.color])} />}
          <h2 className="text-base font-semibold leading-6 text-fg">{event.title}</h2>
        </div>
        <p className="mt-1 pl-5 text-sm text-fg-muted">
          {event.allDay ? (
            <>{formatLongDate(event.start)} · All day</>
          ) : (
            <>
              {formatDay(event.start)}, {formatTimeRange(event.start, event.end)}
              <span className="text-fg-subtle"> · {formatDuration(minutes)}</span>
            </>
          )}
        </p>
      </div>

      {event.videoUrl && (
        <div className="px-4 pb-4">
          <a href={event.videoUrl} target="_blank" rel="noreferrer" className={buttonStyles({ variant: "primary", className: "w-full" })}>
            <Video />
            Join video call
          </a>
        </div>
      )}

      <dl className="flex flex-col gap-3 border-t border-line-subtle px-4 py-4 text-sm">
        {event.location && (
          <Row icon={<MapPin />}>
            <span className="text-fg">{event.location}</span>
          </Row>
        )}
        {event.attendees && event.attendees.length > 0 && (
          <Row icon={<Users />}>
            <ul className="flex flex-col gap-1.5">
              {event.attendees.map((a) => (
                <li key={a} className="flex items-center gap-2 text-fg">
                  <Avatar name={a} size={20} />
                  {a}
                </li>
              ))}
            </ul>
          </Row>
        )}
        {event.description && (
          <Row icon={<AlignLeft />}>
            <p className="whitespace-pre-wrap text-fg-muted">{event.description}</p>
          </Row>
        )}
        {calendar && (
          <Row icon={<CalendarDays />}>
            <span className="flex items-center gap-2 text-fg-muted">
              <IntegrationLogo id={calendar.integrationId} size={14} bare />
              {calendar.name}
              <span className="text-fg-faint">· {calendar.account}</span>
            </span>
          </Row>
        )}
        {project && (
          <Row icon={<ExternalLink />}>
            <ProjectChip project={project} link className="text-sm" />
          </Row>
        )}
      </dl>

      <div className="flex items-center gap-2 border-t border-line-subtle px-4 py-3">
        <Button size="sm" icon={<Pencil />} onClick={onEdit}>
          Edit
        </Button>
        <Button size="sm" variant="ghost" icon={<Trash2 />} onClick={onDelete} className="text-danger hover:bg-danger-soft hover:text-danger">
          Delete
        </Button>
        <PreviewTag className="ml-auto">Sample data</PreviewTag>
      </div>
      <p className="px-4 pb-4 text-xs text-fg-faint">
        Ask LANA to reschedule or prepare. <Link href="/assistant" className="text-fg-subtle underline underline-offset-2 hover:text-fg">Open assistant</Link>
      </p>
    </div>
  );
}

function Row({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[20px_1fr] gap-2.5">
      <dt className="pt-0.5 text-fg-subtle [&_svg]:size-4">{icon}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}
