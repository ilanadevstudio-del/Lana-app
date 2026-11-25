import type { ActionState, AppId, OrbState } from "@/lib/types";

/** An action can also be cancelled: declined by the user or stopped mid-run. */
export type RunState = ActionState | "cancelled";

export type StepState = "pending" | "running" | "done" | "failed";

export interface ActionStep {
  id: string;
  label: string;
  state: StepState;
  detail?: string;
}

export interface ApprovalField {
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

/** One tool execution shown in the thread (PRD §5.6). Also the shape of an action-history record (PRD §5.9). */
export interface ActionRun {
  id: string;
  app: AppId;
  title: string;
  state: RunState;
  steps: ActionStep[];
  approval?: {
    fields: ApprovalField[];
    decision?: "approved" | "declined";
  };
  error?: { message: string; cta?: ActionLink };
  links?: ActionLink[];
}

export type MessagePart = { type: "text"; text: string } | { type: "action"; action: ActionRun };

export interface Message {
  id: string;
  role: "user" | "assistant";
  parts: MessagePart[];
  streaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  /** Lana's current state in this conversation. Drives the orb and the header label. */
  orb: OrbState;
  /** True while Lana is responding or executing; the composer shows Stop. */
  busy: boolean;
}

export interface AssistantState {
  conversations: Conversation[];
  /** null = the "new chat" screen. */
  activeId: string | null;
}
