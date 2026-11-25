import type { CalendarSource, IntegrationConnection, Project, UserProfile } from "@/lib/data/types";
import { at, daysAgo, hoursAgo, minutesAgo } from "./clock";

/** Sample data: the signed-in user, their projects and their (simulated) connections. */

export const mockUser: UserProfile = {
  firstName: "Emmanuel",
  lastName: "Ola",
  email: "emmanuel@example.com",
  timeZone: "Africa/Lagos",
  workspace: "Personal",
  plan: "Preview",
};

export function seedConnections(): IntegrationConnection[] {
  return [
    {
      integrationId: "gmail",
      status: "connected",
      account: "emmanuel@example.com",
      connectedAt: daysAgo(41),
      lastSyncAt: minutesAgo(3),
      simulated: true,
    },
    {
      integrationId: "google-calendar",
      status: "connected",
      account: "emmanuel@example.com",
      connectedAt: daysAgo(41),
      lastSyncAt: minutesAgo(3),
      simulated: true,
    },
    {
      integrationId: "github",
      status: "connected",
      account: "ilanadevstudio-del",
      connectedAt: daysAgo(30),
      lastSyncAt: minutesAgo(12),
      simulated: true,
    },
    {
      integrationId: "notion",
      status: "connected",
      account: "Emmanuel's workspace",
      connectedAt: daysAgo(18),
      lastSyncAt: hoursAgo(1),
      simulated: true,
    },
    {
      integrationId: "slack",
      status: "expired",
      account: "eventfi.slack.com",
      connectedAt: daysAgo(60),
      lastSyncAt: daysAgo(3),
      issue: "Slack revoked LANA's access token. Reconnect to keep reading channels.",
      simulated: true,
    },
  ];
}

export function seedCalendars(): CalendarSource[] {
  return [
    { id: "cal_work", name: "Work", account: "emmanuel@example.com", integrationId: "google-calendar", color: "blue", visible: true },
    { id: "cal_personal", name: "Personal", account: "emmanuel@example.com", integrationId: "google-calendar", color: "green", visible: true },
    { id: "cal_focus", name: "Focus time", account: "Created by LANA", integrationId: "lana", color: "violet", visible: true },
    { id: "cal_eventfi", name: "EventFi team", account: "team@eventfi.example", integrationId: "google-calendar", color: "amber", visible: true },
  ];
}

export function seedProjects(): Project[] {
  return [
    {
      id: "eventfi",
      name: "EventFi v2",
      key: "EF",
      color: "amber",
      status: "active",
      description:
        "Ticketing platform for tech events in Lagos. v2 adds QR check-in, a sponsor dashboard and timezone-aware reminders.",
      milestones: [
        { id: "ms1", label: "QR check-in beta", date: at(-9, "09:00"), done: true },
        { id: "ms2", label: "Sponsor dashboard review", date: at(2, "16:00") },
        { id: "ms3", label: "v2 public launch", date: at(16, "10:00") },
      ],
      notes:
        "Launch depends on the sponsor dashboard. Kemi needs a demo before the partner review.\n\nTobi owns the check-in flow; Ada is finishing the dashboard designs.",
      integrations: ["github", "slack", "notion", "google-calendar"],
      createdAt: daysAgo(74),
      updatedAt: minutesAgo(18),
    },
    {
      id: "lana-launch",
      name: "LANA launch",
      key: "LN",
      color: "violet",
      status: "active",
      description: "Public launch of LANA: landing page, waitlist, launch post and the first 100 beta users.",
      milestones: [
        { id: "ms1", label: "Landing page live", date: at(1, "12:00") },
        { id: "ms2", label: "Waitlist opens", date: at(5, "09:00") },
        { id: "ms3", label: "Launch post", date: at(12, "10:00") },
      ],
      notes: "Keep the message simple: less managing, more doing. Hero video can wait until after launch.",
      integrations: ["notion", "github", "gmail"],
      createdAt: daysAgo(32),
      updatedAt: hoursAgo(1),
    },
    {
      id: "founders-grant",
      name: "Founders grant application",
      key: "GR",
      color: "teal",
      status: "planning",
      description: "Application for the ₦15m founders grant. Needs the financial model, two references and a pitch deck.",
      milestones: [
        { id: "ms1", label: "References confirmed", date: at(3, "17:00") },
        { id: "ms2", label: "Submission deadline", date: at(6, "10:00") },
      ],
      integrations: ["google-drive", "gmail"],
      createdAt: daysAgo(12),
      updatedAt: daysAgo(1),
    },
    {
      id: "apartment-move",
      name: "Apartment move",
      key: "MV",
      color: "green",
      status: "planning",
      description: "Moving to the new flat in Yaba at the end of next month. Movers, internet and change of address.",
      milestones: [
        { id: "ms1", label: "Sign the lease", date: at(4, "11:00") },
        { id: "ms2", label: "Moving day", date: at(33, "08:00") },
      ],
      integrations: ["gmail"],
      createdAt: daysAgo(9),
      updatedAt: daysAgo(2),
    },
    {
      id: "orbit-dashboard",
      name: "Orbit Pay dashboard",
      key: "OP",
      color: "slate",
      status: "completed",
      description: "Freelance build of the merchant dashboard for Orbit Pay. Delivered and invoiced.",
      milestones: [
        { id: "ms1", label: "Handover", date: at(-21, "15:00"), done: true },
        { id: "ms2", label: "Final invoice paid", date: at(-6, "12:00"), done: true },
      ],
      integrations: ["github", "linear"],
      createdAt: daysAgo(120),
      updatedAt: daysAgo(6),
    },
  ];
}
