import { Badge } from "@/components/ui/badge";
import type { IntegrationConnection, IntegrationDefinition } from "@/lib/data/types";

/** One status vocabulary for integrations: Connected / Needs reconnect / Error / Beta / Coming soon. */
export function ConnectionBadge({ integration, connection }: { integration: IntegrationDefinition; connection?: IntegrationConnection }) {
  if (connection?.status === "connected") return <Badge tone="success" dot>Connected</Badge>;
  if (connection?.status === "expired") return <Badge tone="warning" dot>Needs reconnect</Badge>;
  if (connection?.status === "error") return <Badge tone="danger" dot>Error</Badge>;
  if (integration.availability === "coming_soon") return <Badge>Coming soon</Badge>;
  if (integration.availability === "beta") return <Badge tone="info">Beta</Badge>;
  return null;
}
