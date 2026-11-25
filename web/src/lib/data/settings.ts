"use client";

import { createStore } from "./store";

/**
 * User preferences.
 * PREVIEW: kept in memory for this session. These map 1:1 to the planned settings API.
 */
export interface Preferences {
  responseStyle: "concise" | "balanced" | "detailed";
  proactiveSuggestions: boolean;
  askBeforeReading: boolean;
  morningBrief: boolean;
  morningBriefTime: string;
  inputLanguage: string;
  voiceReplies: boolean;
  notify: Record<"approvals" | "completed" | "failed" | "reminders" | "brief", boolean>;
  channels: Record<"inApp" | "email" | "push", boolean>;
  keepHistory: boolean;
  retention: "30" | "90" | "365" | "forever";
  forgetAfter: "never" | "180" | "365";
}

const store = createStore<Preferences>(() => ({
  responseStyle: "balanced",
  proactiveSuggestions: true,
  askBeforeReading: false,
  morningBrief: true,
  morningBriefTime: "08:00",
  inputLanguage: "en-GB",
  voiceReplies: false,
  notify: { approvals: true, completed: false, failed: true, reminders: true, brief: true },
  channels: { inApp: true, email: true, push: false },
  keepHistory: true,
  retention: "365",
  forgetAfter: "never",
}));

export const usePreferences = store.use;

export function updatePreferences(patch: Partial<Preferences>) {
  store.set((p) => ({ ...p, ...patch }));
}
