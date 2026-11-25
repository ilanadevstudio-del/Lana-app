"use client";

import { uid } from "@/lib/data/store";
import { getLibrary } from "@/lib/data/library";
import { attachmentProblems } from "@/lib/data/library-attachments";
import type { ActionField, IntegrationId, StepState } from "@/lib/data/types";
import { pickScenario } from "./scenarios";
import { findConversation, setConversations, updateAction, updateConversation, updateMessage } from "./store";
import type { ActionRun, ApprovalAttachment, ContextRef, Conversation, Message, Phase, SendInput } from "./types";
export type { ApprovalAttachment };

/**
 * Demo execution engine.
 *
 * Plays scripted scenarios through the same lifecycle the real engine will use
 * (understanding → planning → awaiting approval → executing → outcome), so every UI state
 * can be designed and tested. No external service is ever contacted; every action is marked simulated.
 */

// ── Script API ────────────────────────────────────────────────────────────────

export interface ActionHandle {
  id: string;
  patch(patch: Partial<ActionRun>): void;
  step(index: number, state: StepState, detail?: string): void;
  /** Mark a step running, wait, then mark it done. */
  run(index: number, detail?: string, ms?: number): Promise<void>;
  /** Pause for user approval. The engine resumes via approve() / decline(). */
  requestApproval(fields: ActionField[], confirmLabel: string, pending: PendingApproval, attachments?: ApprovalAttachment[]): void;
  /** Finish the action. Pass verified=false when the service didn't confirm the result. */
  finish(outcome: { verified: boolean; summary?: string; links?: ActionRun["links"] }): void;
}

export interface PendingApproval {
  /** Index of the step that represents "waiting for you". */
  waitingStep: number;
  onApprove(ctx: ScriptContext, action: ActionHandle, values: Record<string, string>): Promise<void>;
  onDecline?(ctx: ScriptContext): Promise<void>;
}

export interface ScriptContext {
  say(text: string): Promise<void>;
  action(init: { app: IntegrationId; title: string; steps: string[] }): ActionHandle;
  phase(phase: Phase): void;
  wait(ms: number): Promise<void>;
  fail(message: string): never;
}

/** `context` holds what the user explicitly attached with "@" (apps, projects, Library items). */
export type Script = (ctx: ScriptContext, input: string, context?: ContextRef[]) => Promise<void>;

// ── Internals ─────────────────────────────────────────────────────────────────

const controllers = new Map<string, AbortController>();
const pendingApprovals = new Map<string, PendingApproval>();

class Aborted extends Error {}
class ResponseError extends Error {}

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new Aborted());
    const t = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new Aborted());
      },
      { once: true },
    );
  });
}

const jitter = (min: number, max: number) => min + Math.random() * (max - min);
const now = () => new Date().toISOString();

function makeHandle(convId: string, msgId: string, actionId: string, ctx: ScriptContext): ActionHandle {
  const patch = (p: Partial<ActionRun>) => updateAction(convId, msgId, actionId, (a) => ({ ...a, ...p }));
  const step = (index: number, state: StepState, detail?: string) =>
    updateAction(convId, msgId, actionId, (a) => ({
      ...a,
      steps: a.steps.map((s, i) => (i === index ? { ...s, state, detail: detail ?? s.detail } : s)),
    }));

  return {
    id: actionId,
    patch,
    step,
    async run(index, detail, ms) {
      step(index, "running");
      await ctx.wait(ms ?? jitter(650, 1100));
      step(index, "done", detail);
    },
    requestApproval(fields, confirmLabel, pending, attachments) {
      pendingApprovals.set(actionId, pending);
      step(pending.waitingStep, "running", "Waiting for you");
      patch({ status: "awaiting_approval", approval: { fields, confirmLabel, attachments } });
      ctx.phase("awaiting_approval");
    },
    finish({ verified, summary, links }) {
      patch({ status: verified ? "succeeded" : "unverified", summary, links, finishedAt: now() });
    },
  };
}

function makeContext(convId: string, msgId: string, signal: AbortSignal): ScriptContext {
  const ctx: ScriptContext = {
    wait: (ms) => sleep(ms, signal),

    phase: (phase) => updateConversation(convId, (c) => ({ ...c, phase })),

    fail(message) {
      throw new ResponseError(message);
    },

    async say(text) {
      ctx.phase("responding");
      let index = -1;
      updateMessage(convId, msgId, (m) => {
        index = m.parts.length;
        return { ...m, parts: [...m.parts, { type: "text", text: "" }] };
      });
      const tokens = text.match(/\S+\s*|\s+/g) ?? [];
      let out = "";
      for (let i = 0; i < tokens.length; i += 3) {
        out += tokens.slice(i, i + 3).join("");
        const snapshot = out;
        updateMessage(convId, msgId, (m) => ({
          ...m,
          parts: m.parts.map((p, j) => (j === index && p.type === "text" ? { ...p, text: snapshot } : p)),
        }));
        await ctx.wait(jitter(18, 42));
      }
    },

    action({ app, title, steps }) {
      const id = uid("act");
      const action: ActionRun = {
        id,
        integrationId: app,
        title,
        status: "executing",
        startedAt: now(),
        simulated: true,
        steps: steps.map((label, i) => ({ id: `${id}_${i}`, label, state: "pending" })),
      };
      updateMessage(convId, msgId, (m) => ({ ...m, parts: [...m.parts, { type: "action", action }] }));
      ctx.phase("executing");
      return makeHandle(convId, msgId, id, ctx);
    },
  };
  return ctx;
}

async function execute(convId: string, msgId: string, script: (ctx: ScriptContext) => Promise<void>) {
  const controller = new AbortController();
  controllers.set(convId, controller);
  const ctx = makeContext(convId, msgId, controller.signal);

  try {
    await script(ctx);
  } catch (err) {
    if (err instanceof Aborted) cancelRunningActions(convId, msgId, "Stopped by you");
    else if (err instanceof ResponseError) {
      cancelRunningActions(convId, msgId, "Interrupted");
      updateMessage(convId, msgId, (m) => ({ ...m, error: err.message }));
    } else throw err;
  } finally {
    controllers.delete(convId);
    updateMessage(convId, msgId, (m) => ({ ...m, streaming: false }));
    updateConversation(convId, (c) => ({
      ...c,
      busy: false,
      phase: c.phase === "awaiting_approval" ? c.phase : "idle",
      updatedAt: now(),
    }));
  }
}

function cancelRunningActions(convId: string, msgId: string, reason: string) {
  updateMessage(convId, msgId, (m) => ({
    ...m,
    parts: m.parts.map((p) =>
      p.type === "action" && p.action.status === "executing"
        ? {
            ...p,
            action: {
              ...p.action,
              status: "cancelled",
              finishedAt: now(),
              steps: p.action.steps.map((s) =>
                s.state === "running" ? { ...s, state: "failed", detail: reason } : s.state === "pending" ? { ...s, state: "skipped" } : s,
              ),
            },
          }
        : p,
    ),
  }));
}

function titleFrom(text: string) {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length > 48 ? `${t.slice(0, 48).trimEnd()}…` : t;
}

function moveToTop(convId: string) {
  setConversations((list) => {
    const conv = list.find((c) => c.id === convId);
    return conv ? [conv, ...list.filter((c) => c.id !== convId)] : list;
  });
}

async function respond(convId: string, msgId: string, text: string, context?: ContextRef[]) {
  const scenario = pickScenario(text, context);
  await execute(convId, msgId, async (ctx) => {
    ctx.phase("understanding");
    await ctx.wait(jitter(500, 800));
    ctx.phase("planning");
    await ctx.wait(jitter(400, 700));
    await scenario(ctx, text, context);
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Creates a conversation for the first message, sends it, and returns the new id. */
export function startConversation(input: SendInput) {
  const conv: Conversation = {
    id: uid("c"),
    title: titleFrom(input.text || input.attachments?.[0]?.name || "New conversation"),
    messages: [],
    phase: "idle",
    busy: false,
    createdAt: now(),
    updatedAt: now(),
  };
  setConversations((list) => [conv, ...list]);
  void send(conv.id, input);
  return conv.id;
}

export async function send(convId: string, input: SendInput) {
  const conv = findConversation(convId);
  if (!conv || conv.busy || (!input.text.trim() && !input.attachments?.length)) return;

  const user: Message = {
    id: uid("m"),
    role: "user",
    parts: [{ type: "text", text: input.text.trim() }],
    createdAt: now(),
    attachments: input.attachments?.length ? input.attachments : undefined,
    context: input.context?.length ? input.context : undefined,
  };
  const reply: Message = { id: uid("m"), role: "assistant", parts: [], streaming: true, createdAt: now() };

  updateConversation(convId, (c) => ({
    ...c,
    busy: true,
    phase: "understanding",
    messages: [...c.messages, user, reply],
    updatedAt: now(),
  }));
  moveToTop(convId);
  await respond(convId, reply.id, input.text, input.context);
}

/** Re-runs the last request: drops the last reply and generates a new one. */
export async function retry(convId: string) {
  const conv = findConversation(convId);
  if (!conv || conv.busy) return;
  const lastUser = [...conv.messages].reverse().find((m) => m.role === "user");
  const last = conv.messages[conv.messages.length - 1];
  if (!lastUser) return;
  const text = lastUser.parts.find((p) => p.type === "text")?.text ?? "";
  const context = lastUser.context;
  const reply: Message = { id: uid("m"), role: "assistant", parts: [], streaming: true, createdAt: now() };
  updateConversation(convId, (c) => ({
    ...c,
    busy: true,
    phase: "understanding",
    messages: [...(last?.role === "assistant" ? c.messages.slice(0, -1) : c.messages), reply],
  }));
  await respond(convId, reply.id, text, context);
}

export function stop(convId: string) {
  controllers.get(convId)?.abort();
}

export async function approve(convId: string, msgId: string, actionId: string, fields: ActionField[]) {
  const pending = pendingApprovals.get(actionId);
  if (!pending) return;
  pendingApprovals.delete(actionId);

  // Never send something that isn't exactly what the approval card showed.
  const problems = blockedAttachments(findAction(convId, msgId, actionId));
  if (problems.length) {
    updateAction(convId, msgId, actionId, (a) => ({
      ...a,
      status: "cancelled",
      finishedAt: now(),
      approval: a.approval && { ...a.approval, decision: "declined", decidedAt: now() },
      steps: a.steps.map((s, i) =>
        i === pending.waitingStep ? { ...s, state: "failed", detail: "Attachment no longer matches" } : s.state === "pending" ? { ...s, state: "skipped" } : s,
      ),
    }));
    updateMessage(convId, msgId, (m) => ({ ...m, streaming: true }));
    updateConversation(convId, (c) => ({ ...c, busy: true, phase: "responding" }));
    await execute(convId, msgId, (ctx) =>
      ctx.say(`${problems.map((p) => p.message).join(" ")} I didn't send anything.`),
    );
    return;
  }

  updateAction(convId, msgId, actionId, (a) => ({
    ...a,
    status: "executing",
    approval: a.approval && { ...a.approval, fields, decision: "approved", decidedAt: now() },
  }));
  updateMessage(convId, msgId, (m) => ({ ...m, streaming: true }));
  updateConversation(convId, (c) => ({ ...c, busy: true, phase: "executing" }));

  const values = Object.fromEntries(fields.map((f) => [f.key, f.value]));
  await execute(convId, msgId, async (ctx) => {
    const handle = makeHandle(convId, msgId, actionId, ctx);
    handle.step(pending.waitingStep, "done", "Approved by you");
    await pending.onApprove(ctx, handle, values);
  });
}

export async function decline(convId: string, msgId: string, actionId: string) {
  const pending = pendingApprovals.get(actionId);
  if (!pending) return;
  pendingApprovals.delete(actionId);

  updateAction(convId, msgId, actionId, (a) => ({
    ...a,
    status: "cancelled",
    finishedAt: now(),
    approval: a.approval && { ...a.approval, decision: "declined", decidedAt: now() },
    steps: a.steps.map((s, i) =>
      i === pending.waitingStep
        ? { ...s, state: "failed", detail: "Declined by you" }
        : s.state === "pending"
          ? { ...s, state: "skipped" }
          : s,
    ),
  }));
  updateMessage(convId, msgId, (m) => ({ ...m, streaming: true }));
  updateConversation(convId, (c) => ({ ...c, busy: true, phase: "responding" }));

  await execute(convId, msgId, async (ctx) => {
    if (pending.onDecline) await pending.onDecline(ctx);
    else await ctx.say("Okay, I've cancelled that. Nothing was changed.");
  });
}

function findAction(convId: string, msgId: string, actionId: string) {
  const part = findConversation(convId)
    ?.messages.find((m) => m.id === msgId)
    ?.parts.find((p) => p.type === "action" && p.action.id === actionId);
  return part?.type === "action" ? part.action : undefined;
}

/** Attachments that can't be sent as shown: removed, now never-share, or changed since drafting. */
export function blockedAttachments(action: ActionRun | undefined) {
  return attachmentProblems(action?.approval?.attachments ?? [], getLibrary());
}

/** Why an approval can't go ahead, for the card; undefined when it can. */
export function approvalBlockReason(action: ActionRun | undefined): string | undefined {
  const problems = blockedAttachments(action);
  return problems.length ? problems.map((p) => p.message).join(" ") : undefined;
}

/** True if the approval is still actionable (survives only for the current page session). */
export function isApprovalPending(actionId: string) {
  return pendingApprovals.has(actionId);
}
