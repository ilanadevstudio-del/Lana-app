import type { ActionField, ActionLink, ActionStatus, ActionStep, IntegrationId } from "@/lib/data/types";

/** What LANA is doing right now in a conversation. Drives the header status and the thinking indicator. */
export type Phase = "idle" | "understanding" | "planning" | "responding" | "executing" | "awaiting_approval";

/** One tool execution shown inline in the thread. Same shape as an activity record's core. */
export interface ActionRun {
  id: string;
  integrationId: IntegrationId;
  title: string;
  status: ActionStatus;
  steps: ActionStep[];
  approval?: {
    fields: ActionField[];
    /** Verb for the confirm button, e.g. "Send email". */
    confirmLabel: string;
    decision?: "approved" | "declined";
    decidedAt?: string;
  };
  summary?: string;
  error?: { message: string; cta?: ActionLink };
  links?: ActionLink[];
  startedAt: string;
  finishedAt?: string;
  /** The demo engine never calls real services. */
  simulated: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface ContextRef {
  kind: "integration" | "project";
  id: string;
  label: string;
}

export type MessagePart = { type: "text"; text: string } | { type: "action"; action: ActionRun };

export interface Message {
  id: string;
  role: "user" | "assistant";
  parts: MessagePart[];
  createdAt: string;
  streaming?: boolean;
  attachments?: Attachment[];
  context?: ContextRef[];
  /** Set when the response failed before completing; the UI offers retry. */
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  phase: Phase;
  busy: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssistantState {
  conversations: Conversation[];
}

export interface SendInput {
  text: string;
  attachments?: Attachment[];
  context?: ContextRef[];
}
