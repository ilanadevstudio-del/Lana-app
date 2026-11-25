"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, Laptop, Monitor, Moon, ShieldCheck, Smartphone, Sun } from "lucide-react";
import { IntegrationLogo } from "@/components/lana/integration-logo";
import { useThemePreference } from "@/lib/use-theme";
import { Avatar } from "@/components/ui/avatar";
import { Badge, PreviewTag } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Segmented, SettingRow, Switch } from "@/components/ui/controls";
import { Skeleton } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { integrationName } from "@/lib/data/integration-catalog";
import { setLearnFromIntegrations, setMemoryEnabled, useMemory, useMemorySettings } from "@/lib/data/memory";
import { updatePreferences, usePreferences, type Preferences } from "@/lib/data/settings";
import type { UserProfile } from "@/lib/data/types";
import { updateUser, useConnections, useUser } from "@/lib/data/workspace";
import { formatRelative } from "@/lib/format";
import { SettingsGroup, SettingsSection } from "./settings-shell";

/** Applies a preference immediately and confirms quietly. */
function usePref() {
  const prefs = usePreferences();
  const set = (patch: Partial<Preferences>) => {
    updatePreferences(patch);
    toast({ title: "Preference saved" });
  };
  return [prefs, set] as const;
}

function Loading() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Loading settings">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}

// ── Profile ───────────────────────────────────────────────────────────────────

const TIME_ZONES = ["Africa/Lagos", "Europe/London", "Europe/Berlin", "America/New_York", "America/Los_Angeles", "Asia/Dubai", "Asia/Singapore"];

export function ProfileSettings() {
  const user = useUser();
  if (!user) return <Loading />;
  return <ProfileForm key={user.email} user={user} />;
}

function ProfileForm({ user }: { user: UserProfile }) {
  const [form, setForm] = useState(user);
  const [submitted, setSubmitted] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(user);
  const errors = { firstName: !form.firstName.trim() ? "First name is required." : undefined };
  const set = <K extends keyof UserProfile>(k: K, v: UserProfile[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <SettingsSection title="Profile" description="How LANA addresses you and works out your local time.">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          if (errors.firstName) return;
          updateUser({ ...form, firstName: form.firstName.trim(), lastName: form.lastName.trim() });
          toast({ title: "Profile updated", tone: "success" });
        }}
        className="flex flex-col gap-6"
      >
        <div className="flex items-center gap-4">
          <Avatar name={`${form.firstName} ${form.lastName}`} size={52} />
          <div>
            <p className="text-sm font-medium text-fg">
              {form.firstName} {form.lastName}
            </p>
            <p className="text-xs text-fg-subtle">{user.workspace} workspace · {user.plan}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" error={submitted ? errors.firstName : undefined}>
            {(p) => <Input {...p} value={form.firstName} onChange={(e) => set("firstName", e.target.value)} autoComplete="given-name" />}
          </Field>
          <Field label="Last name" optional>
            {(p) => <Input {...p} value={form.lastName} onChange={(e) => set("lastName", e.target.value)} autoComplete="family-name" />}
          </Field>
        </div>
        <Field label="Email" hint="Your sign-in email. Changing it requires verification, which isn't available in the preview.">
          {(p) => <Input {...p} value={form.email} disabled />}
        </Field>
        <Field label="Time zone" hint="Used for reminders, scheduling and your morning brief.">
          {(p) => (
            <Select {...p} value={form.timeZone} onChange={(e) => set("timeZone", e.target.value)}>
              {TIME_ZONES.map((z) => (
                <option key={z} value={z}>
                  {z.replace("_", " ")}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <div className="flex justify-end gap-2 border-t border-line-subtle pt-4">
          <Button disabled={!dirty} onClick={() => setForm(user)}>
            Discard
          </Button>
          <Button type="submit" variant="primary" disabled={!dirty}>
            Save changes
          </Button>
        </div>
      </form>
    </SettingsSection>
  );
}

// ── Assistant ─────────────────────────────────────────────────────────────────

export function AssistantSettings() {
  const [p, set] = usePref();
  if (!p) return <Loading />;
  return (
    <SettingsSection title="Assistant" description="How LANA responds and when it acts on its own.">
      <SettingsGroup title="Responses">
        <SettingRow title="Response style" description="How much detail LANA includes by default.">
          <Segmented
            label="Response style"
            size="sm"
            value={p.responseStyle}
            onChange={(v) => set({ responseStyle: v })}
            options={[
              { value: "concise", label: "Concise" },
              { value: "balanced", label: "Balanced" },
              { value: "detailed", label: "Detailed" },
            ]}
          />
        </SettingRow>
        <SettingRow title="Proactive suggestions" description="Suggest next steps on Home and after completing an action.">
          <Switch checked={p.proactiveSuggestions} onCheckedChange={(v) => set({ proactiveSuggestions: v })} label="Proactive suggestions" />
        </SettingRow>
        <SettingRow title="Morning brief" description="A summary of your day, delivered on weekdays.">
          <div className="flex items-center gap-2">
            <input
              type="time"
              aria-label="Morning brief time"
              value={p.morningBriefTime}
              disabled={!p.morningBrief}
              onChange={(e) => set({ morningBriefTime: e.target.value })}
              className="h-7 rounded-md border border-line bg-panel px-2 text-xs text-fg disabled:opacity-50"
            />
            <Switch checked={p.morningBrief} onCheckedChange={(v) => set({ morningBrief: v })} label="Morning brief" />
          </div>
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup title="Approvals">
        <SettingRow
          title="Ask before changing anything"
          description="Sending, creating, editing or deleting anything in a connected app always needs your approval. This can't be turned off."
        >
          <Badge icon={<ShieldCheck />}>Always on</Badge>
        </SettingRow>
        <SettingRow title="Ask before reading sensitive data" description="Also ask before opening email bodies, files or private channels.">
          <Switch checked={p.askBeforeReading} onCheckedChange={(v) => set({ askBeforeReading: v })} label="Ask before reading sensitive data" />
        </SettingRow>
      </SettingsGroup>
    </SettingsSection>
  );
}

// ── Voice and language ────────────────────────────────────────────────────────

export function VoiceSettings() {
  const [p, set] = usePref();
  if (!p) return <Loading />;
  return (
    <SettingsSection title="Voice and language" description="Speech input uses your browser's recognition service.">
      <SettingsGroup>
        <SettingRow title="Input language" description="The language you speak to LANA in." htmlFor="input-language">
          <Select id="input-language" value={p.inputLanguage} onChange={(e) => set({ inputLanguage: e.target.value })} className="w-48">
            <option value="en-GB">English (UK)</option>
            <option value="en-US">English (US)</option>
            <option value="en-NG">English (Nigeria)</option>
            <option value="fr-FR">French</option>
            <option value="yo-NG">Yoruba</option>
          </Select>
        </SettingRow>
        <SettingRow title="Spoken replies" description="Read LANA's answers aloud after voice requests.">
          <Switch checked={p.voiceReplies} onCheckedChange={(v) => set({ voiceReplies: v })} label="Spoken replies" />
        </SettingRow>
        <SettingRow title="Voice" description="Choose how LANA sounds.">
          <Badge>Coming soon</Badge>
        </SettingRow>
      </SettingsGroup>
    </SettingsSection>
  );
}

// ── Notifications ─────────────────────────────────────────────────────────────

const NOTIFY: { key: keyof Preferences["notify"]; title: string; description: string }[] = [
  { key: "approvals", title: "Approval requests", description: "When LANA needs your go-ahead." },
  { key: "failed", title: "Failed or unverified actions", description: "When something didn't work or couldn't be confirmed." },
  { key: "completed", title: "Completed actions", description: "Every time an action finishes successfully." },
  { key: "reminders", title: "Reminders", description: "Task and event reminders you've set." },
  { key: "brief", title: "Morning brief", description: "Your daily summary." },
];

export function NotificationSettings() {
  const [p, set] = usePref();
  if (!p) return <Loading />;
  return (
    <SettingsSection title="Notifications" description="Choose what LANA tells you about, and where.">
      <SettingsGroup title="Notify me about">
        {NOTIFY.map((n) => (
          <SettingRow key={n.key} title={n.title} description={n.description}>
            <Switch checked={p.notify[n.key]} onCheckedChange={(v) => set({ notify: { ...p.notify, [n.key]: v } })} label={n.title} />
          </SettingRow>
        ))}
      </SettingsGroup>
      <SettingsGroup title="Channels">
        <SettingRow title="In the app" description="Badges and toasts while LANA is open.">
          <Switch checked={p.channels.inApp} onCheckedChange={(v) => set({ channels: { ...p.channels, inApp: v } })} label="In-app notifications" />
        </SettingRow>
        <SettingRow title="Email" description="Sent to your sign-in email.">
          <Switch checked={p.channels.email} onCheckedChange={(v) => set({ channels: { ...p.channels, email: v } })} label="Email notifications" />
        </SettingRow>
        <SettingRow title="Push" description="On your phone and desktop.">
          <Badge>Coming soon</Badge>
        </SettingRow>
      </SettingsGroup>
    </SettingsSection>
  );
}

// ── Connected accounts ────────────────────────────────────────────────────────

export function AccountsSettings() {
  const connections = useConnections();
  if (!connections) return <Loading />;
  return (
    <SettingsSection
      title="Connected accounts"
      description={
        <>
          Accounts LANA can act on. Manage capabilities and permissions in{" "}
          <Link href="/integrations" className="text-fg-muted underline underline-offset-2 hover:text-fg">
            Integrations
          </Link>
          .
        </>
      }
    >
      <SettingsGroup>
        {connections.map((c) => (
          <div key={c.integrationId} className="flex items-center gap-3 py-3">
            <IntegrationLogo id={c.integrationId} size={28} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-fg">{integrationName(c.integrationId)}</p>
              <p className="truncate text-xs text-fg-subtle">
                {c.account} · connected {formatRelative(c.connectedAt)}
              </p>
            </div>
            {c.simulated && <PreviewTag className="hidden sm:inline-flex" />}
            {c.status === "connected" ? <Badge tone="success" dot>Connected</Badge> : <Badge tone="warning" dot>Needs reconnect</Badge>}
          </div>
        ))}
      </SettingsGroup>
      <Link href="/integrations" className={buttonStyles({ variant: "secondary", className: "self-start" })}>
        Manage integrations
      </Link>
    </SettingsSection>
  );
}

// ── Privacy and data ──────────────────────────────────────────────────────────

export function PrivacySettings() {
  const [p, set] = usePref();
  const [confirm, setConfirm] = useState(false);
  if (!p) return <Loading />;
  return (
    <SettingsSection title="Privacy and data" description="You own your data. Here's what LANA keeps and how to remove it.">
      <SettingsGroup title="Conversations">
        <SettingRow title="Keep conversation history" description="Lets you revisit past conversations. LANA can still remember key facts if this is off.">
          <Switch checked={p.keepHistory} onCheckedChange={(v) => set({ keepHistory: v })} label="Keep conversation history" />
        </SettingRow>
        <SettingRow title="Keep history for" description="Older conversations and action logs are deleted automatically." htmlFor="retention">
          <Select id="retention" value={p.retention} onChange={(e) => set({ retention: e.target.value as Preferences["retention"] })} className="w-40">
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="365">1 year</option>
            <option value="forever">Until I delete it</option>
          </Select>
        </SettingRow>
      </SettingsGroup>
      <SettingsGroup title="Your data">
        <SettingRow title="Export your data" description="Conversations, tasks, memory and action history as JSON.">
          <Button size="sm" onClick={() => toast({ title: "Export isn't available in the preview", description: "There's no stored data to export yet." })}>
            Request export
          </Button>
        </SettingRow>
      </SettingsGroup>
      <SettingsGroup title="Danger zone" danger>
        <SettingRow title="Delete all data" description="Permanently deletes conversations, memory, tasks and disconnects every integration.">
          <Button size="sm" variant="danger" onClick={() => setConfirm(true)}>
            Delete everything
          </Button>
        </SettingRow>
      </SettingsGroup>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Delete all your data?"
        description="This can't be undone. In the preview, reloading the page restores the sample data instead."
        confirmLabel="Delete everything"
        destructive
        onConfirm={() => toast({ title: "Nothing was deleted", description: "Deleting data requires the backend, which the preview doesn't have." })}
      />
    </SettingsSection>
  );
}

// ── Memory ────────────────────────────────────────────────────────────────────

export function MemorySettings() {
  const settings = useMemorySettings();
  const memory = useMemory();
  const [p, set] = usePref();
  if (!settings || !p || !memory) return <Loading />;
  return (
    <SettingsSection
      title="Memory"
      description={
        <>
          LANA remembers {memory.length} things about you.{" "}
          <Link href="/memory" className="text-fg-muted underline underline-offset-2 hover:text-fg">
            Review them
          </Link>
          .
        </>
      }
    >
      <SettingsGroup>
        <SettingRow title="Use memory" description="Personalise answers and actions with what LANA remembers.">
          <Switch
            checked={settings.enabled}
            onCheckedChange={(v) => {
              setMemoryEnabled(v);
              toast({ title: v ? "Memory turned on" : "Memory paused" });
            }}
            label="Use memory"
          />
        </SettingRow>
        <SettingRow title="Learn from connected apps" description="Let LANA pick up facts from email, calendar and other integrations, not only from chat.">
          <Switch
            checked={settings.learnFromIntegrations}
            disabled={!settings.enabled}
            onCheckedChange={(v) => {
              setLearnFromIntegrations(v);
              toast({ title: "Preference saved" });
            }}
            label="Learn from connected apps"
          />
        </SettingRow>
        <SettingRow title="Forget unused memories" description="Remove memories LANA hasn't used in a while." htmlFor="forget">
          <Select id="forget" value={p.forgetAfter} onChange={(e) => set({ forgetAfter: e.target.value as Preferences["forgetAfter"] })} className="w-40">
            <option value="never">Never</option>
            <option value="180">After 6 months</option>
            <option value="365">After 1 year</option>
          </Select>
        </SettingRow>
      </SettingsGroup>
    </SettingsSection>
  );
}

// ── Security ──────────────────────────────────────────────────────────────────

export function SecuritySettings() {
  return (
    <SettingsSection title="Security" description="Sign-in methods and active sessions.">
      <SettingsGroup title="Sign-in">
        <SettingRow title="Two-step verification" description="Require a code from an authenticator app when signing in.">
          <Badge>Coming soon</Badge>
        </SettingRow>
        <SettingRow title="Passkeys" description="Sign in with your device instead of a password.">
          <Badge>Coming soon</Badge>
        </SettingRow>
      </SettingsGroup>
      <SettingsGroup title="Active sessions">
        <Session icon={<Laptop />} name="This browser" detail="Lagos, Nigeria · active now" current />
        <Session icon={<Smartphone />} name="LANA on iPhone" detail="Sample session · last active 2 days ago" />
      </SettingsGroup>
      <p className="text-xs text-fg-subtle">Authentication isn&apos;t connected in the preview, so session management is shown for design only.</p>
    </SettingsSection>
  );
}

function Session({ icon, name, detail, current }: { icon: ReactNode; name: string; detail: string; current?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="grid size-8 place-items-center rounded-md border border-line bg-raised text-fg-subtle [&_svg]:size-4">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-fg">{name}</p>
        <p className="text-xs text-fg-subtle">{detail}</p>
      </div>
      {current ? <Badge tone="success">This device</Badge> : <Button size="sm" variant="ghost" disabled>Sign out</Button>}
    </div>
  );
}

// ── Appearance ────────────────────────────────────────────────────────────────

export function AppearanceSettings() {
  const [theme, setTheme] = useThemePreference();
  const options = [
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "system" as const, label: "System", icon: Monitor },
  ];
  return (
    <SettingsSection title="Appearance" description="LANA is designed dark-first. Light follows the same system.">
      <fieldset>
        <legend className="mb-2 text-xs font-medium text-fg-subtle">Theme</legend>
        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-3">
          {options.map(({ value, label, icon: Icon }) => {
            const active = theme === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setTheme(value)}
                className={cn("overflow-hidden rounded-lg border text-left transition-colors", active ? "border-accent-line ring-2 ring-accent-soft" : "border-line hover:border-line-strong")}
              >
                <ThemePreview kind={value} />
                <span className="flex items-center gap-2 border-t border-line-subtle px-3 py-2 text-sm text-fg">
                  <Icon className="size-3.5 text-fg-subtle" />
                  {label}
                  {active && <Check className="ml-auto size-3.5 text-accent-text" />}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
      <SettingsGroup>
        <SettingRow title="Reduced motion" description="LANA follows your operating system's reduced-motion setting automatically.">
          <Badge>System</Badge>
        </SettingRow>
      </SettingsGroup>
    </SettingsSection>
  );
}

function ThemePreview({ kind }: { kind: "dark" | "light" | "system" }) {
  const pane = (dark: boolean) => (
    <div className={cn("flex h-full flex-1 gap-1.5 p-2", dark ? "bg-[#0b0b0d]" : "bg-[#fbfbfc]")}>
      <div className={cn("w-1/4 rounded-sm", dark ? "bg-[#17171b]" : "bg-[#eeeef1]")} />
      <div className="flex flex-1 flex-col gap-1">
        <div className={cn("h-1.5 w-3/4 rounded-full", dark ? "bg-[#2a2a30]" : "bg-[#dcdce1]")} />
        <div className={cn("h-1.5 w-1/2 rounded-full", dark ? "bg-[#2a2a30]" : "bg-[#dcdce1]")} />
        <div className="mt-auto h-2.5 w-1/3 rounded-sm bg-[#6e6af5]" />
      </div>
    </div>
  );
  return <div className="flex h-20">{kind === "system" ? (<>{pane(true)}{pane(false)}</>) : pane(kind === "dark")}</div>;
}
