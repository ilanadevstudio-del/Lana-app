import {
  CalendarBlankIcon,
  EnvelopeSimpleIcon,
  GithubLogoIcon,
  NotionLogoIcon,
  SparkleIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { AppId } from "@/lib/types";

export const APPS: Record<AppId, { label: string; icon: Icon; color: string }> = {
  lana: { label: "Lana", icon: SparkleIcon, color: "var(--accent)" },
  gmail: { label: "Gmail", icon: EnvelopeSimpleIcon, color: "#ea4335" },
  github: { label: "GitHub", icon: GithubLogoIcon, color: "var(--foreground)" },
  "google-calendar": { label: "Google Calendar", icon: CalendarBlankIcon, color: "#4285f4" },
  notion: { label: "Notion", icon: NotionLogoIcon, color: "var(--foreground)" },
  whatsapp: { label: "WhatsApp", icon: WhatsappLogoIcon, color: "#25d366" },
};

export function AppIcon({ app, size = 36 }: { app: AppId; size?: number }) {
  const { icon: Glyph, color, label } = APPS[app];
  return (
    <span
      title={label}
      className="glass-strong grid shrink-0 place-items-center rounded-xl"
      style={{ width: size, height: size }}
    >
      <Glyph size={Math.round(size * 0.5)} weight="duotone" style={{ color }} />
    </span>
  );
}
