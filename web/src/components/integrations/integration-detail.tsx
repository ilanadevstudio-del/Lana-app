"use client";

import { Eye, PenLine, RefreshCw, ShieldCheck } from "lucide-react";
import { IntegrationLogo } from "@/components/lana/integration-logo";
import { Badge, PreviewTag } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/feedback";
import { toast } from "@/components/ui/toast";
import { CATEGORY_LABELS } from "@/lib/data/integration-catalog";
import type { IntegrationConnection, IntegrationDefinition } from "@/lib/data/types";
import { reconnectIntegration } from "@/lib/data/workspace";
import { formatRelative, formatShortDate } from "@/lib/format";
import { ConnectionBadge } from "./integration-status";

export function IntegrationDetail({
  integration,
  connection,
  onConnect,
  onDisconnect,
}: {
  integration: IntegrationDefinition;
  connection?: IntegrationConnection;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const soon = integration.availability === "coming_soon";
  return (
    <div className="flex flex-col">
      <div className="flex items-start gap-3 px-4 py-4">
        <IntegrationLogo id={integration.id} size={40} />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-fg">{integration.name}</h2>
          <p className="text-xs text-fg-subtle">{CATEGORY_LABELS[integration.category]}</p>
        </div>
        <ConnectionBadge integration={integration} connection={connection} />
      </div>
      <p className="px-4 pb-4 text-sm text-fg-muted">{integration.description}</p>

      {connection?.status === "expired" && (
        <div className="px-4 pb-4">
          <Callout tone="warning">{connection.issue}</Callout>
        </div>
      )}

      {connection && (
        <dl className="mx-4 mb-4 grid grid-cols-[110px_1fr] gap-y-2 rounded-lg border border-line px-3 py-3 text-sm">
          <dt className="text-fg-subtle">Account</dt>
          <dd className="truncate text-fg">{connection.account}</dd>
          <dt className="text-fg-subtle">Connected</dt>
          <dd className="text-fg">{formatShortDate(connection.connectedAt)}</dd>
          <dt className="text-fg-subtle">Last sync</dt>
          <dd className="text-fg">{connection.lastSyncAt ? formatRelative(connection.lastSyncAt) : "Never"}</dd>
          {connection.simulated && (
            <>
              <dt className="text-fg-subtle">Mode</dt>
              <dd>
                <PreviewTag />
              </dd>
            </>
          )}
        </dl>
      )}

      {integration.capabilities.length > 0 && (
        <section className="border-t border-line-subtle px-4 py-4">
          <h3 className="mb-2 text-xs font-medium text-fg-subtle">What LANA can do</h3>
          <ul className="flex flex-col gap-2">
            {integration.capabilities.map((c) => (
              <li key={c.label} className="flex items-center gap-2.5 text-sm">
                {c.kind === "read" ? <Eye className="size-3.5 shrink-0 text-fg-subtle" /> : <PenLine className="size-3.5 shrink-0 text-fg-subtle" />}
                <span className="flex-1 text-fg">{c.label}</span>
                {c.requiresApproval && (
                  <Badge tone="neutral" icon={<ShieldCheck />} title="LANA always asks before doing this">
                    Asks first
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {integration.permissions.length > 0 && (
        <section className="border-t border-line-subtle px-4 py-4">
          <h3 className="mb-2 text-xs font-medium text-fg-subtle">Permissions requested</h3>
          <ul className="flex list-disc flex-col gap-1 pl-4 text-sm text-fg-muted marker:text-fg-faint">
            {integration.permissions.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap gap-2 border-t border-line-subtle px-4 py-3">
        {soon ? (
          <p className="text-sm text-fg-subtle">This integration isn&apos;t available yet. It&apos;s on the roadmap.</p>
        ) : connection ? (
          <>
            {connection.status !== "connected" && (
              <Button
                variant="primary"
                size="sm"
                icon={<RefreshCw />}
                onClick={() => {
                  reconnectIntegration(integration.id);
                  toast({ title: `${integration.name} reconnected (simulated)`, tone: "success" });
                }}
              >
                Reconnect
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onDisconnect} className="text-danger hover:bg-danger-soft hover:text-danger">
              Disconnect
            </Button>
          </>
        ) : (
          <Button variant="primary" size="sm" onClick={onConnect}>
            Connect {integration.name}
          </Button>
        )}
      </div>
    </div>
  );
}
