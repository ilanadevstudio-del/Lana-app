import type { OrbState } from "@/lib/types";
import { pickScenario } from "./scenarios";
import { getState, setState, updateAction, updateConversation, updateMessage } from "./store";
import type { ActionRun, ApprovalField, Conversation, Message, StepState } from "./types";

/**
 * Mock execution engine.
 *
 * It plays scripted scenarios through the same lifecycle the real engine will use
 * (understanding → planning → awaiting approval → executing → completed/failed/partial),
 * so the UI can be designed against every state. Swapped for real backend calls later.
 */

// ── Script API ────────────────────────────────────────────────────────────────

export interface ActionHandle {
  id: string;
  patch(patch: Partial<ActionRun>): void;
  step(index: number, state: StepState, detail?: string): void;
  /** Mark a step running, wait, then mark it done. */
  run(index: number, detail?: string, ms?: number): Promise<void>;
  /** Pause for user approval. The engine resumes via `onApprove` / `onDecline`. */
  requestApproval(fields: ApprovalField[], pending: PendingApproval): void;
}

export interface PendingApproval {
  /** Index of the step that represents "waiting for you". */
  waitingStep: number;
  onApprove(ctx: ScriptContext, action: ActionHandle, values: Record<string, string>): Promise<void>;
  onDecline?(ctx: ScriptContext): Promise<void>;
}

export interface ScriptContext {
  say(text: string): Promise<void>;
  action(init: { app: ActionRun["app"]; title: string; steps: string[] }): ActionHandle;
  orb(state: OrbState): void;
  wait(ms: number): Promise<void>;
}

export type Script = (ctx: ScriptContext, input: string) => Promise<void>;

// ── Internals ─────────────────────────────────────────────────────────────────

let seq = 0;
const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(seq++).toString(36)}`;

const controllers = new Map<string, AbortController>();
const pendingApprovals = new Map<string, PendingApproval>();

class Aborted extends Error {}

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
    requestApproval(fields, pending) {
      pendingApprovals.set(actionId, pending);
      step(pending.waitingStep, "running", "Waiting for you");
      patch({ state: "awaiting_approval", approval: { fields } });
      ctx.orb("awaiting_approval");
    },
  };
}

function makeContext(convId: string, msgId: string, signal: AbortSignal): ScriptContext {
  const ctx: ScriptContext = {
    wait: (ms) => sleep(ms, signal),

    orb: (orb) => updateConversation(convId, (c) => ({ ...c, orb })),

    async say(text) {
      let index = -1;
      updateMessage(convId, msgId, (m) => {
        index = m.parts.length;
        return { ...m, parts: [...m.parts, { type: "text", text: "" }] };
      });
      const tokens = text.match(/\S+\s*|\s+/g) ?? [];
      let out = "";
      for (let i = 0; i < tokens.length; i += 2) {
        out += tokens.slice(i, i + 2).join("");
        const snapshot = out;
        updateMessage(convId, msgId, (m) => ({
          ...m,
          parts: m.parts.map((p, j) => (j === index && p.type === "text" ? { ...p, text: snapshot } : p)),
        }));
        await ctx.wait(jitter(22, 50));
      }
    },

    action({ app, title, steps }) {
      const id = uid("act");
      const action: ActionRun = {
        id,
        app,
        title,
        state: "executing",
        steps: steps.map((label, i) => ({ id: `${id}_${i}`, label, state: "pending" })),
      };
      updateMessage(convId, msgId, (m) => ({ ...m, parts: [...m.parts, { type: "action", action }] }));
      ctx.orb("executing");
      return makeHandle(convId, msgId, id, ctx);
    },
  };
  return ctx;
}

/** States that only make sense while something is running. */
const TRANSIENT: OrbState[] = ["understanding", "planning", "executing"];

async function execute(convId: string, msgId: string, script: (ctx: ScriptContext) => Promise<void>) {
  const controller = new AbortController();
  controllers.set(convId, controller);
  const ctx = makeContext(convId, msgId, controller.signal);

  try {
    await script(ctx);
  } catch (err) {
    if (!(err instanceof Aborted)) throw err;
    cancelRunningActions(convId, msgId);
    ctx.orb("idle");
  } finally {
    controllers.delete(convId);
    updateMessage(convId, msgId, (m) => ({ ...m, streaming: false }));
    updateConversation(convId, (c) => ({ ...c, busy: false, orb: TRANSIENT.includes(c.orb) ? "idle" : c.orb }));
    settleOrb(convId);
  }
}

/** Outcome colours (completed/failed/partial) fade back to idle after a moment. */
function settleOrb(convId: string) {
  setTimeout(() => {
    updateConversation(convId, (c) =>
      c.busy || c.orb === "awaiting_approval" || c.orb === "idle" ? c : { ...c, orb: "idle" },
    );
  }, 2600);
}

function cancelRunningActions(convId: string, msgId: string) {
  updateMessage(convId, msgId, (m) => ({
    ...m,
    parts: m.parts.map((p) =>
      p.type === "action" && TRANSIENT.includes(p.action.state as OrbState)
        ? {
            ...p,
            action: {
              ...p.action,
              state: "cancelled",
              steps: p.action.steps.map((s) =>
                s.state === "running" ? { ...s, state: "failed", detail: "Stopped by you" } : s,
              ),
            },
          }
        : p,
    ),
  }));
}

function titleFrom(text: string) {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length > 40 ? `${t.slice(0, 40).trimEnd()}…` : t;
}

function moveToTop(convId: string) {
  setState((s) => {
    const conv = s.conversations.find((c) => c.id === convId);
    if (!conv) return s;
    return { ...s, conversations: [conv, ...s.conversations.filter((c) => c.id !== convId)] };
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export function newChat() {
  setState((s) => ({ ...s, activeId: null }));
}

export function selectConversation(id: string) {
  setState((s) => ({ ...s, activeId: id }));
}

/** Creates a conversation for the first message and sends it. */
export function startConversation(text: string) {
  const conv: Conversation = { id: uid("conv"), title: titleFrom(text), messages: [], orb: "idle", busy: false };
  setState((s) => ({ conversations: [conv, ...s.conversations], activeId: conv.id }));
  void send(conv.id, text);
}

export async function send(convId: string, text: string) {
  const conv = getState().conversations.find((c) => c.id === convId);
  if (!conv || conv.busy || !text.trim()) return;

  const user: Message = { id: uid("msg"), role: "user", parts: [{ type: "text", text: text.trim() }] };
  const reply: Message = { id: uid("msg"), role: "assistant", parts: [], streaming: true };

  updateConversation(convId, (c) => ({
    ...c,
    busy: true,
    orb: "understanding",
    messages: [...c.messages, user, reply],
  }));
  moveToTop(convId);

  const scenario = pickScenario(text);
  await execute(convId, reply.id, async (ctx) => {
    await ctx.wait(jitter(600, 900));
    ctx.orb("planning");
    await ctx.wait(jitter(500, 800));
    await scenario(ctx, text);
  });
}

export function stop(convId: string) {
  controllers.get(convId)?.abort();
}

export async function approve(convId: string, msgId: string, actionId: string, fields: ApprovalField[]) {
  const pending = pendingApprovals.get(actionId);
  if (!pending) return;
  pendingApprovals.delete(actionId);

  updateAction(convId, msgId, actionId, (a) => ({
    ...a,
    state: "executing",
    approval: { fields, decision: "approved" },
  }));
  updateMessage(convId, msgId, (m) => ({ ...m, streaming: true }));
  updateConversation(convId, (c) => ({ ...c, busy: true, orb: "executing" }));

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
    state: "cancelled",
    approval: a.approval && { ...a.approval, decision: "declined" },
    steps: a.steps.map((s, i) => (i === pending.waitingStep ? { ...s, state: "failed", detail: "Declined by you" } : s)),
  }));
  updateMessage(convId, msgId, (m) => ({ ...m, streaming: true }));
  updateConversation(convId, (c) => ({ ...c, busy: true, orb: "idle" }));

  await execute(convId, msgId, async (ctx) => {
    if (pending.onDecline) await pending.onDecline(ctx);
    else await ctx.say("Okay, I've cancelled that. Nothing was changed.");
  });
}
