"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Search, SearchX } from "lucide-react";
import { IntegrationLogo } from "@/components/lana/integration-logo";
import { Page, PageHeader, PageToolbar, SplitView } from "@/components/shell/page";
import { PreviewTag } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { CATEGORY_LABELS, CATEGORY_ORDER, INTEGRATIONS } from "@/lib/data/integration-catalog";
import type { IntegrationCategory, IntegrationConnection, IntegrationDefinition, IntegrationId } from "@/lib/data/types";
import { reconnectIntegration, useConnections } from "@/lib/data/workspace";
import { formatRelative, plural } from "@/lib/format";
import { toast } from "@/components/ui/toast";
import { ConnectDialog, DisconnectDialog } from "./integration-dialogs";
import { IntegrationDetail } from "./integration-detail";
import { ConnectionBadge } from "./integration-status";

type Filter = "all" | "connected" | IntegrationCategory;

export function IntegrationsView() {
  const connections = useConnections();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<IntegrationId | null>(null);
  const [connecting, setConnecting] = useState<IntegrationDefinition | null>(null);
  const [disconnecting, setDisconnecting] = useState<IntegrationDefinition | null>(null);

  const byId = useMemo(() => new Map(connections?.map((c) => [c.integrationId, c])), [connections]);
  const q = query.trim().toLowerCase();
  const matches = INTEGRATIONS.filter(
    (i) =>
      (!q || i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || CATEGORY_LABELS[i.category].toLowerCase().includes(q)) &&
      (filter === "all" || (filter === "connected" ? byId.has(i.id) : i.category === filter)),
  );
  const selected = INTEGRATIONS.find((i) => i.id === selectedId);
  const attention = connections?.filter((c) => c.status !== "connected") ?? [];
  const connected = matches.filter((i) => byId.has(i.id));
  const rest = matches.filter((i) => !byId.has(i.id));

  const filters: { value: Filter; label: string; count?: number }[] = [
    { value: "all", label: "All" },
    { value: "connected", label: "Connected", count: connections?.length },
    ...CATEGORY_ORDER.map((c) => ({ value: c, label: CATEGORY_LABELS[c] })),
  ];

  return (
    <Page>
      <PageHeader
        title="Integrations"
        meta={<span className="text-xs text-fg-subtle">{INTEGRATIONS.length} apps</span>}
        actions={
          <Input
            icon={<Search />}
            size="sm"
            placeholder="Search integrations"
            aria-label="Search integrations"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-44 sm:w-60"
          />
        }
      />
      <PageToolbar>
        <nav aria-label="Filter integrations" className="flex gap-0.5">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              aria-current={filter === f.value || undefined}
              className={cn(
                "flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                filter === f.value ? "bg-pressed text-fg" : "text-fg-subtle hover:bg-hover hover:text-fg",
              )}
            >
              {f.label}
              {!!f.count && <span className="tabular-nums text-fg-subtle">{f.count}</span>}
            </button>
          ))}
        </nav>
      </PageToolbar>

      <SplitView
        asideTitle="Integration"
        onAsideClose={() => setSelectedId(null)}
        aside={
          selected && (
            <IntegrationDetail
              integration={selected}
              connection={byId.get(selected.id)}
              onConnect={() => setConnecting(selected)}
              onDisconnect={() => setDisconnecting(selected)}
            />
          )
        }
      >
        <div className="mx-auto w-full max-w-[1100px] px-4 pb-16 pt-5 md:px-6">
          {!connections ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading integrations">
              {Array.from({ length: 9 }, (_, i) => (
                <Skeleton key={i} className="h-[132px] rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              {attention.length > 0 && filter === "all" && !q && (
                <div className="mb-6 flex flex-col gap-2">
                  {attention.map((c) => {
                    const def = INTEGRATIONS.find((i) => i.id === c.integrationId)!;
                    return (
                      <div key={c.integrationId} className="flex flex-wrap items-center gap-3 rounded-lg border border-warning/25 bg-warning-soft px-3.5 py-2.5">
                        <AlertTriangle className="size-4 shrink-0 text-warning" />
                        <IntegrationLogo id={c.integrationId} size={24} />
                        <p className="min-w-0 flex-1 text-sm text-fg">
                          <span className="font-medium">{def.name}</span> <span className="text-fg-muted">— {c.issue}</span>
                        </p>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            reconnectIntegration(c.integrationId);
                            toast({ title: `${def.name} reconnected (simulated)`, tone: "success" });
                          }}
                        >
                          Reconnect
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {matches.length === 0 ? (
                <EmptyState
                  icon={<SearchX />}
                  title={`No integrations match “${query}”`}
                  description="Try a different name or category."
                  action={<Button size="sm" onClick={() => setQuery("")}>Clear search</Button>}
                />
              ) : (
                <>
                  {connected.length > 0 && filter !== "connected" && (
                    <Section title="Connected" count={connected.length}>
                      <ConnectedList items={connected} byId={byId} selectedId={selectedId} onSelect={setSelectedId} />
                    </Section>
                  )}
                  {filter === "connected" ? (
                    <Section title="Connected" count={connected.length}>
                      <ConnectedList items={connected} byId={byId} selectedId={selectedId} onSelect={setSelectedId} />
                    </Section>
                  ) : filter === "all" && !q ? (
                    CATEGORY_ORDER.map((cat) => {
                      const items = rest.filter((i) => i.category === cat);
                      return items.length ? (
                        <Section key={cat} title={CATEGORY_LABELS[cat]} count={items.length}>
                          <Grid items={items} byId={byId} selectedId={selectedId} onSelect={setSelectedId} onConnect={setConnecting} />
                        </Section>
                      ) : null;
                    })
                  ) : (
                    rest.length > 0 && (
                      <Section title={q ? "Results" : "Available"} count={rest.length}>
                        <Grid items={rest} byId={byId} selectedId={selectedId} onSelect={setSelectedId} onConnect={setConnecting} />
                      </Section>
                    )
                  )}
                </>
              )}
            </>
          )}
        </div>
      </SplitView>

      <ConnectDialog integration={connecting} onClose={() => setConnecting(null)} />
      <DisconnectDialog
        integration={disconnecting}
        onClose={() => setDisconnecting(null)}
      />
    </Page>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-2.5 flex items-baseline gap-2 text-xs font-medium text-fg-muted">
        {title}
        <span className="tabular-nums text-fg-faint">{count}</span>
      </h2>
      {children}
    </section>
  );
}

function ConnectedList({
  items,
  byId,
  selectedId,
  onSelect,
}: {
  items: IntegrationDefinition[];
  byId: Map<IntegrationId, IntegrationConnection>;
  selectedId: IntegrationId | null;
  onSelect: (id: IntegrationId) => void;
}) {
  return (
    <ul className="overflow-hidden rounded-lg border border-line bg-panel">
      {items.map((i) => {
        const c = byId.get(i.id)!;
        return (
          <li key={i.id} className="border-b border-line-subtle last:border-0">
            <button
              type="button"
              onClick={() => onSelect(i.id)}
              className={cn("flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors", selectedId === i.id ? "bg-pressed" : "hover:bg-hover")}
            >
              <IntegrationLogo id={i.id} size={28} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-fg">{i.name}</span>
                <span className="block truncate text-xs text-fg-subtle">{c.account}</span>
              </span>
              <span className="hidden text-xs text-fg-subtle md:inline">
                {c.lastSyncAt ? `Synced ${formatRelative(c.lastSyncAt)}` : ""}
              </span>
              {c.simulated && <PreviewTag className="hidden sm:inline-flex" />}
              <ConnectionBadge integration={i} connection={c} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Grid({
  items,
  byId,
  selectedId,
  onSelect,
  onConnect,
}: {
  items: IntegrationDefinition[];
  byId: Map<IntegrationId, IntegrationConnection>;
  selectedId: IntegrationId | null;
  onSelect: (id: IntegrationId) => void;
  onConnect: (i: IntegrationDefinition) => void;
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => {
        const soon = i.availability === "coming_soon";
        return (
          <li
            key={i.id}
            className={cn(
              "group relative flex flex-col rounded-lg border bg-panel p-3.5 transition-colors",
              selectedId === i.id ? "border-accent-line" : "border-line hover:border-line-strong",
            )}
          >
            <div className="flex items-start gap-3">
              <IntegrationLogo id={i.id} size={32} className={soon ? "opacity-60 grayscale" : undefined} />
              <div className="min-w-0 flex-1">
                <button type="button" onClick={() => onSelect(i.id)} className="text-left text-sm font-medium text-fg after:absolute after:inset-0 focus-visible:outline-none">
                  {i.name}
                </button>
                <p className="text-2xs text-fg-subtle">{CATEGORY_LABELS[i.category]}</p>
              </div>
              <ConnectionBadge integration={i} connection={byId.get(i.id)} />
            </div>
            <p className="mt-2.5 line-clamp-2 min-h-10 text-xs leading-5 text-fg-muted">{i.description}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-2xs text-fg-faint">
                {i.capabilities.length ? plural(i.capabilities.length, "capability", "capabilities") : "Details soon"}
              </span>
              {!soon && (
                <Button size="sm" variant="secondary" onClick={() => onConnect(i)} className="relative z-10">
                  Connect
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
