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
