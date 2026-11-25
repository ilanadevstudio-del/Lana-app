"use client";

import { useState } from "react";
import { Check, Info } from "lucide-react";
import { IntegrationLogo } from "@/components/lana/integration-logo";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/overlays";
import { toast } from "@/components/ui/toast";
import type { IntegrationDefinition } from "@/lib/data/types";
import { connectIntegration, disconnectIntegration } from "@/lib/data/workspace";

/**
 * Permission review before connecting. In production the primary button hands off to the
 * provider's OAuth consent screen; in the preview it records a clearly labelled simulated connection.
 */
export function ConnectDialog({ integration, onClose }: { integration: IntegrationDefinition | null; onClose: () => void }) {
  const [account, setAccount] = useState("");
  return (
    <Dialog
      open={!!integration}
      onOpenChange={(o) => !o && onClose()}
      title={integration ? `Connect ${integration.name}` : "Connect"}
      footer={
        integration && (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!account.trim()}
              onClick={() => {
                connectIntegration(integration.id, account.trim());
                toast({ title: `${integration.name} connected (simulated)`, description: "No real account was linked in the preview.", tone: "success" });
                setAccount("");
                onClose();
              }}
            >
              Connect (simulated)
            </Button>
          </>
        )
      }
    >
      {integration && (
        <div className="flex flex-col gap-4 pb-1">
          <div className="flex items-center gap-3">
            <IntegrationLogo id={integration.id} size={40} />
            <p className="text-sm text-fg-muted">{integration.description}</p>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-medium text-fg-subtle">LANA will be able to</h3>
            <ul className="flex flex-col gap-1.5">
              {integration.permissions.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-fg">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-fg-subtle" />
                  {p}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-fg-subtle">
              Anything that sends, changes or deletes data in {integration.name} always waits for your approval. You can disconnect at any time.
            </p>
          </div>
          <Field label="Account" hint="In the preview, this is only used as a label.">
            {(p) => <Input {...p} autoFocus value={account} onChange={(e) => setAccount(e.target.value)} placeholder="you@example.com" />}
          </Field>
          <p className="flex items-start gap-2 rounded-md border border-dashed border-line-strong px-3 py-2 text-xs text-fg-muted">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            The preview build has no OAuth backend, so this creates a simulated connection. Actions through it are simulated too.
          </p>
        </div>
      )}
    </Dialog>
  );
}

export function DisconnectDialog({ integration, onClose }: { integration: IntegrationDefinition | null; onClose: () => void }) {
  return (
    <ConfirmDialog
      open={!!integration}
      onOpenChange={(o) => !o && onClose()}
      title={`Disconnect ${integration?.name ?? ""}?`}
      description="LANA will lose access immediately. Scheduled actions that use it will pause, and memory learned from it is kept until you delete it."
      confirmLabel="Disconnect"
      destructive
      onConfirm={() => {
        if (!integration) return;
        disconnectIntegration(integration.id);
        toast({ title: `${integration.name} disconnected` });
      }}
    />
  );
}
