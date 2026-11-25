"use client";

import { seedActivity } from "@/lib/mock/activity";
import { integrationName } from "./integration-catalog";
import { createStore } from "./store";
import type { ActionField, ActionRecord } from "./types";

/**
 * Action history, approvals and scheduled actions.
 * PREVIEW: approving here does not call any service. The record is marked "unverified"
 * with an explicit note, because nothing confirmed that anything happened.
 */
const store = createStore<ActionRecord[]>(seedActivity);

export const useActivity = store.use;
export const getActivityList = store.get;

/** Adds a record of something LANA did (newest first). */
export function addActivityRecord(record: ActionRecord) {
  store.set((list) => [record, ...list]);
}

function patch(id: string, fn: (a: ActionRecord) => ActionRecord) {
  store.set((list) => list.map((a) => (a.id === id ? fn(a) : a)));
}

const waitingIndex = (a: ActionRecord) => a.steps.findIndex((s) => s.state === "running");

export function approveAction(id: string, fields?: ActionField[]) {
  patch(id, (a) => {
    const w = waitingIndex(a);
    return {
      ...a,
      fields: fields ?? a.fields,
      status: "executing",
      decidedAt: new Date().toISOString(),
      steps: a.steps.map((s, i) =>
        i === w ? { ...s, state: "done", detail: "Approved by you" } : i === w + 1 ? { ...s, state: "running" } : s,
      ),
    };
  });

  // Simulated run: nothing is sent, so the outcome is honestly "unverified".
  setTimeout(() => {
    patch(id, (a) => ({
      ...a,
      status: "unverified",
      finishedAt: new Date().toISOString(),
      summary: `Preview: no request was sent to ${integrationName(a.integrationId)}`,
      steps: a.steps.map((s) =>
        s.state === "running" || s.state === "pending" ? { ...s, state: "skipped", detail: "Simulated" } : s,
      ),
    }));
  }, 1400);
}

export function rejectAction(id: string) {
  patch(id, (a) => {
    const w = waitingIndex(a);
    return {
      ...a,
      status: "cancelled",
      finishedAt: new Date().toISOString(),
      decidedAt: new Date().toISOString(),
      summary: "Declined by you. Nothing was changed.",
      steps: a.steps.map((s, i) =>
        i === w ? { ...s, state: "failed", detail: "Declined by you" } : s.state === "pending" ? { ...s, state: "skipped" } : s,
      ),
    };
  });
}

export function cancelScheduled(id: string) {
  patch(id, (a) => ({
    ...a,
    status: "cancelled",
    summary: "Schedule cancelled by you",
    steps: a.steps.map((s) => ({ ...s, state: "skipped" })),
  }));
}
