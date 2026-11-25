import type { IntegrationCategory, IntegrationDefinition, IntegrationId } from "./types";

/**
 * The integration catalogue. This is product configuration rather than sample data:
 * it describes what LANA supports and what each integration is allowed to do.
 * "coming_soon" entries can't be connected and are shown as such.
 */

export const CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  communication: "Communication",
  productivity: "Productivity",
  development: "Development",
  storage: "Storage",
  research: "Research",
  other: "Other",
};

export const CATEGORY_ORDER: IntegrationCategory[] = [
  "communication",
  "productivity",
  "development",
  "storage",
  "research",
  "other",
];

const soon = (
  id: IntegrationId,
  name: string,
  category: IntegrationCategory,
  description: string,
  capabilities: string[] = [],
): IntegrationDefinition => ({
  id,
  name,
  category,
  description,
  availability: "coming_soon",
  capabilities: capabilities.map((label) => ({ label, kind: "read" as const })),
  permissions: [],
});

export const INTEGRATIONS: IntegrationDefinition[] = [
  {
    id: "gmail",
    name: "Gmail",
    category: "communication",
    description: "Read, triage and draft email. Sending always needs your approval.",
    availability: "available",
    featured: true,
    capabilities: [
      { label: "Search and read messages", kind: "read" },
      { label: "Summarise threads", kind: "read" },
      { label: "Draft replies", kind: "write" },
      { label: "Send email", kind: "write", requiresApproval: true },
      { label: "Archive and label", kind: "write", requiresApproval: true },
    ],
    permissions: ["Read your email and settings", "Create drafts", "Send email on your behalf"],
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    category: "productivity",
    description: "See your schedule, find free time and manage events.",
    availability: "available",
    featured: true,
    capabilities: [
      { label: "Read events and availability", kind: "read" },
      { label: "Create events", kind: "write", requiresApproval: true },
      { label: "Reschedule and cancel", kind: "write", requiresApproval: true },
      { label: "Respond to invitations", kind: "write", requiresApproval: true },
    ],
    permissions: ["See and edit events on all your calendars", "See your calendar list"],
  },
  {
    id: "github",
    name: "GitHub",
    category: "development",
    description: "Track pull requests, issues and reviews across your repositories.",
    availability: "available",
    featured: true,
    capabilities: [
      { label: "Read repositories, PRs and issues", kind: "read" },
      { label: "Summarise review status", kind: "read" },
      { label: "Comment on PRs and issues", kind: "write", requiresApproval: true },
      { label: "Merge pull requests", kind: "write", requiresApproval: true },
    ],
    permissions: ["Read repository contents and metadata", "Read and write pull requests", "Read and write issues"],
  },
  {
    id: "notion",
    name: "Notion",
    category: "productivity",
    description: "Search your workspace, create pages and keep notes in sync.",
    availability: "available",
    featured: true,
    capabilities: [
      { label: "Search pages and databases", kind: "read" },
      { label: "Create pages", kind: "write" },
      { label: "Update database entries", kind: "write", requiresApproval: true },
      { label: "Share pages", kind: "write", requiresApproval: true },
    ],
    permissions: ["Read content in pages you share with LANA", "Insert and update content"],
  },
  {
    id: "slack",
    name: "Slack",
    category: "communication",
    description: "Catch up on channels and send messages to your team.",
    availability: "available",
    capabilities: [
      { label: "Read channels and threads", kind: "read" },
      { label: "Summarise unread activity", kind: "read" },
      { label: "Send messages", kind: "write", requiresApproval: true },
    ],
    permissions: ["View messages in channels you're in", "Send messages as you"],
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    category: "communication",
    description: "Send messages through the WhatsApp Business API.",
    availability: "beta",
    capabilities: [{ label: "Send messages to saved contacts", kind: "write", requiresApproval: true }],
    permissions: ["Send messages from your linked business number"],
  },
  {
    id: "google-drive",
    name: "Google Drive",
    category: "storage",
    description: "Find files and use documents as context for your requests.",
    availability: "available",
    capabilities: [
      { label: "Search files", kind: "read" },
      { label: "Read document contents", kind: "read" },
      { label: "Upload files", kind: "write", requiresApproval: true },
    ],
    permissions: ["See and download files you open with LANA", "Search file names and metadata"],
  },
  {
    id: "linear",
    name: "Linear",
    category: "development",
    description: "Create and triage issues, and follow cycle progress.",
    availability: "beta",
    capabilities: [
      { label: "Read issues and cycles", kind: "read" },
      { label: "Create issues", kind: "write", requiresApproval: true },
      { label: "Update status and assignee", kind: "write", requiresApproval: true },
    ],
    permissions: ["Read workspace issues and projects", "Create and update issues"],
  },
  soon("trello", "Trello", "productivity", "Move cards and keep boards up to date.", ["Read boards and cards"]),
  soon("google-docs", "Google Docs", "productivity", "Draft and edit documents with LANA."),
  soon("google-sheets", "Google Sheets", "productivity", "Read and update spreadsheets."),
  soon("todoist", "Todoist", "productivity", "Sync tasks both ways with Todoist."),
  soon("asana", "Asana", "productivity", "Follow projects and update tasks in Asana."),
  soon("airtable", "Airtable", "productivity", "Query and update Airtable bases."),
  soon("calendly", "Calendly", "productivity", "Share booking links and see scheduled meetings."),
  soon("confluence", "Confluence", "productivity", "Search and summarise team documentation."),
  soon("obsidian", "Obsidian", "productivity", "Use your local vault as context."),
  soon("discord", "Discord", "communication", "Catch up on servers and channels."),
  soon("telegram", "Telegram", "communication", "Send and read Telegram messages."),
  soon("zoom", "Zoom", "communication", "Schedule meetings and fetch recordings."),
  soon("gitlab", "GitLab", "development", "Track merge requests and pipelines."),
  soon("jira", "Jira", "development", "Create and triage Jira issues."),
  soon("sentry", "Sentry", "development", "Summarise new errors and regressions."),
  soon("vercel", "Vercel", "development", "Check deployments and build status."),
  soon("figma", "Figma", "development", "Follow comments and file changes."),
  soon("dropbox", "Dropbox", "storage", "Find and share files in Dropbox."),
  soon("perplexity", "Perplexity", "research", "Cited web research inside LANA."),
  soon("wikipedia", "Wikipedia", "research", "Look up facts and background."),
  soon("arxiv", "arXiv", "research", "Search and summarise papers."),
  soon("stripe", "Stripe", "other", "Check payments, payouts and customers."),
  soon("hubspot", "HubSpot", "other", "Look up contacts and deals."),
];

const BY_ID = new Map(INTEGRATIONS.map((i) => [i.id, i]));

/** "lana" is LANA itself (tasks, reminders, memory) and is not in the catalogue. */
export function integrationName(id: IntegrationId) {
  return id === "lana" ? "LANA" : (BY_ID.get(id)?.name ?? id);
}

export function getIntegration(id: IntegrationId) {
  return BY_ID.get(id);
}
