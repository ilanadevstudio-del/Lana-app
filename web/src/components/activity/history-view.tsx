"use client";

import { useMemo, useState } from "react";
import { History, Search, SearchX } from "lucide-react";
import { IntegrationLogo } from "@/components/lana/integration-logo";
import { SplitView } from "@/components/shell/page";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ListSkeleton } from "@/components/ui/feedback";
import { FilterMenu } from "@/components/ui/filter-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { useActivity } from "@/lib/data/activity";
import { integrationName } from "@/lib/data/integration-catalog";
import type { ActionStatus, IntegrationId } from "@/lib/data/types";
import { useProjects } from "@/lib/data/workspace";
import { formatRelative } from "@/lib/format";
import { ACTION_STATUS } from "@/lib/status";
import { ActivityDetail } from "./activity-detail";
import { HISTORY_STATUSES, NEEDS_REVIEW } from "./activity-filters";

/** Action history as a dense, filterable table. `review` limits it to outcomes that need a look. */
export function HistoryView({ review }: { review?: boolean }) {
  const activity = useActivity();
  const projects = useProjects();
  const [status, setStatus] = useState<"all" | ActionStatus>("all");
  const [app, setApp] = useState<"all" | IntegrationId>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const base = useMemo(
    () =>
      activity
        ?.filter((a) => (review ? NEEDS_REVIEW.includes(a.status) : HISTORY_STATUSES.includes(a.status)))
        .sort((a, b) => (b.finishedAt ?? b.createdAt).localeCompare(a.finishedAt ?? a.createdAt)) ?? null,
    [activity, review],
  );
  const apps = [...new Set(base?.map((a) => a.integrationId))];
  const q = query.trim().toLowerCase();
  const rows = base?.filter(
    (a) =>
      (status === "all" || a.status === status) &&
      (app === "all" || a.integrationId === app) &&
      (!q || a.title.toLowerCase().includes(q) || a.summary?.toLowerCase().includes(q)),
  );
  const selected = activity?.find((a) => a.id === selectedId);
  const statuses = review ? NEEDS_REVIEW : HISTORY_STATUSES;
  const filtered = status !== "all" || app !== "all" || !!q;

  return (
    <SplitView
      asideTitle="Action"
      onAsideClose={() => setSelectedId(null)}
      aside={selected && <ActivityDetail record={selected} project={projects?.find((p) => p.id === selected.projectId)} />}
    >
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 md:px-5">
        <Input
          icon={<Search />}
          size="sm"
          placeholder="Search actions"
          aria-label="Search actions"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full sm:w-56"
        />
        <FilterMenu
          label="Status"
          value={status}
          onChange={setStatus}
          options={[{ value: "all" as const, label: "Any" }, ...statuses.map((s) => ({ value: s, label: ACTION_STATUS[s].label }))]}
        />
        <FilterMenu
          label="App"
          value={app}
          onChange={setApp}
          options={[
            { value: "all" as const, label: "Any" },
            ...apps.map((id) => ({ value: id, label: integrationName(id), icon: <IntegrationLogo id={id} size={14} bare /> })),
          ]}
        />
      </div>

      {!rows ? (
        <div className="px-5">
          <ListSkeleton rows={8} />
        </div>
      ) : rows.length === 0 ? (
        filtered ? (
          <EmptyState
            icon={<SearchX />}
            title="No actions match these filters"
            action={
              <Button
                size="sm"
                onClick={() => {
                  setStatus("all");
                  setApp("all");
                  setQuery("");
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<History />}
            title={review ? "Nothing needs review" : "No activity yet"}
            description={
              review ? "Failed, partial and unverified actions will appear here." : "Actions LANA takes for you will be listed here."
            }
          />
        )
      ) : (
        <div className="pb-16">
          <div
            aria-hidden
            className="hidden h-8 grid-cols-[minmax(0,1fr)_120px_130px_110px] items-center gap-4 border-y border-line-subtle px-5 text-2xs font-medium text-fg-subtle md:grid"
          >
            <span>Action</span>
            <span>App</span>
            <span>Status</span>
            <span className="text-right">When</span>
          </div>
          <ul aria-label="Action history">
            {rows.map((a) => (
              <li key={a.id}>
                <button
                  type="button"

                  onClick={() => setSelectedId(selectedId === a.id ? null : a.id)}
                  aria-current={selectedId === a.id || undefined}
                  className={cn(
                    "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-line-subtle px-4 py-2.5 text-left transition-colors md:grid-cols-[minmax(0,1fr)_120px_130px_110px] md:px-5",
                    selectedId === a.id ? "bg-pressed" : "hover:bg-hover",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <IntegrationLogo id={a.integrationId} size={26} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-fg">{a.title}</span>
                      <span className="block truncate text-xs text-fg-subtle">{a.summary ?? a.error ?? a.origin.label}</span>
                    </span>
                  </span>
                  <span className="hidden truncate text-xs text-fg-muted md:block">{integrationName(a.integrationId)}</span>
                  <span>
                    <StatusBadge status={a.status} />
                  </span>
                  <span className="hidden text-right text-xs tabular-nums text-fg-subtle md:block">
                    {formatRelative(a.finishedAt ?? a.createdAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SplitView>
  );
}
