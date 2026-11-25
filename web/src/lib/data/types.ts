/**
 * Domain model for the LANA client.
 *
 * These are the shapes the UI renders. Every timestamp is an ISO string; formatting lives in lib/format.ts.
 * The backend contract will map onto these types inside lib/data, so pages never change when it lands.
 */

// ── Integrations ──────────────────────────────────────────────────────────────

export type IntegrationId =
  | "lana"
  | "github"
  | "gmail"
  | "google-calendar"
  | "notion"
  | "slack"
  | "whatsapp"
  | "google-drive"
  | "linear"
  | "trello"
  | "figma"
  | "dropbox"
  | "jira"
  | "discord"
  | "telegram"
  | "zoom"
  | "todoist"
  | "asana"
  | "airtable"
  | "confluence"
  | "gitlab"
  | "google-docs"
  | "google-sheets"
  | "calendly"
  | "sentry"
  | "vercel"
  | "stripe"
  | "hubspot"
  | "obsidian"
  | "wikipedia"
  | "arxiv"
  | "perplexity";

export type IntegrationCategory = "communication" | "productivity" | "development" | "storage" | "research" | "other";

/** Whether LANA can connect to it at all in this build. */
export type IntegrationAvailability = "available" | "beta" | "coming_soon";

export interface IntegrationCapability {
  label: string;
  kind: "read" | "write";
  /** Write actions that change something outside LANA always ask first. */
  requiresApproval?: boolean;
}

export interface IntegrationDefinition {
  id: IntegrationId;
  name: string;
  description: string;
  category: IntegrationCategory;
  availability: IntegrationAvailability;
  capabilities: IntegrationCapability[];
  /** OAuth scopes in plain language. */
  permissions: string[];
  /** Featured in the catalogue header. */
  featured?: boolean;
}

export type ConnectionStatus = "connected" | "expired" | "error";

export interface IntegrationConnection {
  integrationId: IntegrationId;
  status: ConnectionStatus;
  account: string;
  connectedAt: string;
  lastSyncAt?: string;
  /** Present when status isn't "connected". */
  issue?: string;
  /** True for preview connections that only exist in sample data. */
  simulated: boolean;
}

// ── Actions, approvals, activity ──────────────────────────────────────────────

/**
 * What the UI says about an action. "succeeded" requires verification from the target service;
 * an action that ran without confirmation is "unverified", never "succeeded".
 */
export type ActionStatus =
  | "proposed"
  | "awaiting_approval"
  | "scheduled"
  | "executing"
  | "succeeded"
  | "unverified"
  | "partially_completed"
  | "failed"
  | "cancelled";

export type StepState = "pending" | "running" | "done" | "failed" | "skipped";

export interface ActionStep {
  id: string;
  label: string;
  state: StepState;
  detail?: string;
}

export interface ActionField {
  key: string;
  label: string;
  value: string;
  editable?: boolean;
  multiline?: boolean;
}

export interface ActionLink {
  label: string;
  href: string;
}

export interface ActionRecord {
  id: string;
  integrationId: IntegrationId;
  title: string;
  /** One-line result, e.g. "4 open PRs, 1 ready to merge". */
  summary?: string;
  status: ActionStatus;
  steps: ActionStep[];
  /** Details shown for review (recipient, subject…). */
  fields?: ActionField[];
  createdAt: string;
  /** For scheduled actions. */
  runAt?: string;
  finishedAt?: string;
  /** When the user approved or declined it. */
  decidedAt?: string;
  error?: string;
  links?: ActionLink[];
  /** Where the request came from. */
  origin: { kind: "conversation" | "automation" | "schedule"; label: string; href?: string };
  projectId?: string;
  /** No real side effects happened: sample data or demo engine. */
  simulated: boolean;
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export type Priority = "urgent" | "high" | "medium" | "low" | "none";
export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: string;
  title: string;
  notes?: string;
  status: TaskStatus;
  priority: Priority;
  /** Local date key (yyyy-mm-dd). */
  due?: string;
  /** Optional time on the due date (HH:mm). */
  dueTime?: string;
  projectId?: string;
  labels?: string[];
  createdAt: string;
  completedAt?: string;
  source?: { kind: "manual" | "assistant" | "integration"; label: string; integrationId?: IntegrationId };
}

// ── Calendar ──────────────────────────────────────────────────────────────────

export type CategoryColor = "blue" | "violet" | "green" | "amber" | "rose" | "teal" | "slate";

export interface CalendarSource {
  id: string;
  name: string;
  account: string;
  integrationId: IntegrationId;
  color: CategoryColor;
  visible: boolean;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  location?: string;
  videoUrl?: string;
  attendees?: string[];
  description?: string;
  projectId?: string;
}

// ── Projects ──────────────────────────────────────────────────────────────────

export type ProjectStatus = "active" | "planning" | "paused" | "completed";

export interface ProjectMilestone {
  id: string;
  label: string;
  date: string;
  done?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  color: CategoryColor;
  /** Short symbol shown in the project tile. */
  key: string;
  milestones: ProjectMilestone[];
  notes?: string;
  integrations: IntegrationId[];
  updatedAt: string;
  createdAt: string;
}

// ── Memory ────────────────────────────────────────────────────────────────────

export type MemoryCategory = "personal" | "people" | "projects" | "preferences" | "commitments" | "work";

export interface MemoryItem {
  id: string;
  category: MemoryCategory;
  title: string;
  detail: string;
  source?: { kind: "conversation" | "integration" | "manual"; label: string; integrationId?: IntegrationId };
  projectId?: string;
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
}

// ── Library ───────────────────────────────────────────────────────────────────

export type LibraryItemKind = "file" | "link" | "text";

export interface LibraryShare {
  at: string;
  to: string;
  via: IntegrationId;
  /** The activity record for this share, when there is one. */
  actionId?: string;
}

/** Something the user shares repeatedly: a file, a link or a text snippet. */
export interface LibraryItem {
  id: string;
  kind: LibraryItemKind;
  /** How it's shown, and the main way LANA refers to it: "CV". */
  name: string;
  /** Other names that resolve to it: ["resume", "curriculum vitae"]. */
  aliases: string[];
  description?: string;
  /** previewUrl is an object URL for files uploaded this session. */
  file?: { fileName: string; size: number; mimeType: string; previewUrl?: string };
  link?: { url: string };
  text?: { body: string };
  /** Every share needs approval anyway; "never" means LANA won't use it in any action. */
  sharing: "ask" | "never";
  /** Earlier files, newest first. */
  versions?: { id: string; fileName: string; size: number; replacedAt: string }[];
  /** Newest first. */
  shares: LibraryShare[];
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── People & account ──────────────────────────────────────────────────────────

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  timeZone: string;
  workspace: string;
  plan: string;
}
