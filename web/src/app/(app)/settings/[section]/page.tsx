import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  AccountsSettings,
  AppearanceSettings,
  AssistantSettings,
  MemorySettings,
  NotificationSettings,
  PrivacySettings,
  ProfileSettings,
  SecuritySettings,
  VoiceSettings,
} from "@/components/settings/sections";

const SECTIONS = {
  profile: { title: "Profile", Component: ProfileSettings },
  accounts: { title: "Connected accounts", Component: AccountsSettings },
  security: { title: "Security", Component: SecuritySettings },
  assistant: { title: "Assistant settings", Component: AssistantSettings },
  voice: { title: "Voice and language", Component: VoiceSettings },
  memory: { title: "Memory settings", Component: MemorySettings },
  notifications: { title: "Notifications", Component: NotificationSettings },
  privacy: { title: "Privacy and data", Component: PrivacySettings },
  appearance: { title: "Appearance", Component: AppearanceSettings },
} as const;

type Section = keyof typeof SECTIONS;

export function generateStaticParams() {
  return Object.keys(SECTIONS).map((section) => ({ section }));
}

export async function generateMetadata({ params }: PageProps<"/settings/[section]">): Promise<Metadata> {
  const { section } = await params;
  return { title: SECTIONS[section as Section]?.title ?? "Settings" };
}

export default async function SettingsSectionPage({ params }: PageProps<"/settings/[section]">) {
  const { section } = await params;
  const entry = SECTIONS[section as Section];
  if (!entry) notFound();
  const { Component } = entry;
  return <Component />;
}
