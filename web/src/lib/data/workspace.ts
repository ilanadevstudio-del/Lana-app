"use client";

import { mockUser, seedConnections, seedProjects } from "@/lib/mock/workspace";
import { createStore } from "./store";
import type { IntegrationConnection, IntegrationId, Project } from "./types";

/**
 * User, projects and integration connections.
 * PREVIEW: there is no auth or OAuth backend yet. Connections are simulated and clearly labelled as such.
 */

const user = createStore(() => mockUser);
export const useUser = user.use;
export const getUser = user.get;

const projects = createStore<Project[]>(seedProjects);
export const useProjects = projects.use;
export const getProjects = projects.get;

export function createProject(input: Pick<Project, "name" | "description" | "status" | "color">) {
  const now = new Date().toISOString();
  const words = input.name.trim().split(/\s+/);
  const key = (words.length > 1 ? words[0][0] + words[1][0] : input.name.slice(0, 2)).toUpperCase();
  const project: Project = {
    ...input,
    id: `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString(36).slice(-4)}`,
    key,
    milestones: [],
    integrations: [],
    createdAt: now,
    updatedAt: now,
  };
  projects.set((list) => [project, ...list]);
  return project;
}

export function updateUser(patch: Partial<ReturnType<typeof user.get>>) {
  user.set((u) => ({ ...u, ...patch }));
}

export function updateProject(id: string, patch: Partial<Project>) {
  projects.set((list) => list.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p)));
}

const connections = createStore<IntegrationConnection[]>(seedConnections);
export const useConnections = connections.use;
export const getConnections = connections.get;

/** PREVIEW: records a simulated connection. The real flow redirects to the provider's OAuth consent screen. */
export function connectIntegration(id: IntegrationId, account: string) {
  const now = new Date().toISOString();
  connections.set((list) => [
    ...list.filter((c) => c.integrationId !== id),
    { integrationId: id, status: "connected", account, connectedAt: now, lastSyncAt: now, simulated: true },
  ]);
}

export function disconnectIntegration(id: IntegrationId) {
  connections.set((list) => list.filter((c) => c.integrationId !== id));
}

export function reconnectIntegration(id: IntegrationId) {
  const now = new Date().toISOString();
  connections.set((list) =>
    list.map((c) => (c.integrationId === id ? { ...c, status: "connected", issue: undefined, lastSyncAt: now } : c)),
  );
}
