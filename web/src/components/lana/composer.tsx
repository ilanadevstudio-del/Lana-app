"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Command } from "cmdk";
import { ArrowUp, AtSign, FileText, FolderKanban, LibraryBig, Mic, Paperclip, Square, X } from "lucide-react";
import { IconButton } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/overlays";
import { toast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import type { Attachment, ContextRef, SendInput } from "@/lib/assistant/types";
import { cn } from "@/lib/cn";
import { integrationName } from "@/lib/data/integration-catalog";
import { useLibrary } from "@/lib/data/library";
import { uid } from "@/lib/data/store";
import type { IntegrationId } from "@/lib/data/types";
import { useConnections, useProjects } from "@/lib/data/workspace";
import { formatBytes } from "@/lib/format";
import { isTyping } from "@/lib/ui-state";
import { IntegrationLogo } from "./integration-logo";
import { useSpeechInput } from "./use-speech-input";

const MAX_FILE = 10 * 1024 * 1024;

export interface ComposerHandle {
  focus(): void;
  setText(text: string): void;
}

/**
 * The conversational composer used on Home and in conversations.
 * Enter sends, Shift+Enter adds a line, "@" adds context, "/" focuses it from anywhere on the page.
 */
export const Composer = forwardRef<
  ComposerHandle,
  {
    onSubmit: (input: SendInput) => void;
    busy?: boolean;
    onStop?: () => void;
    placeholder?: string;
    autoFocus?: boolean;
    variant?: "hero" | "dock";
    className?: string;
  }
>(function Composer({ onSubmit, busy, onStop, placeholder = "Ask LANA to do something…", autoFocus, variant = "dock", className }, ref) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [context, setContext] = useState<ContextRef[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const speech = useSpeechInput((transcript) => setText((t) => (t ? `${t.trimEnd()} ${transcript}` : transcript)));

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
    setText: (t: string) => {
      setText(t);
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (el) {
          el.focus();
          el.setSelectionRange(t.length, t.length);
        }
      });
    },
  }));

  // Auto-grow up to a limit.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, variant === "hero" ? 240 : 200)}px`;
  }, [text, speech.interim, variant]);

  // "/" focuses the composer when nothing else has focus.
  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "/" && !isTyping(e) && !e.metaKey && !e.ctrlKey && !document.querySelector("[role=dialog]")) {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const canSend = !busy && (text.trim().length > 0 || attachments.length > 0);

  function submit() {
    if (!canSend) return;
    if (speech.listening) speech.stop();
    onSubmit({ text: text.trim(), attachments, context });
    setText("");
    setAttachments([]);
    setContext([]);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
    if (e.key === "Escape" && busy) onStop?.();
  }

  function onChange(value: string) {
    // "@" at the start of a word opens the context picker.
    const el = textareaRef.current;
    const caret = el?.selectionStart ?? value.length;
    if (value[caret - 1] === "@" && (caret === 1 || /\s/.test(value[caret - 2]))) {
      setText(value.slice(0, caret - 1) + value.slice(caret));
      setPickerOpen(true);
      return;
    }
    setText(value);
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const next: Attachment[] = [];
    for (const f of Array.from(files)) {
      if (f.size > MAX_FILE) {
        toast({ title: `${f.name} is too large`, description: "Files can be up to 10 MB.", tone: "danger" });
        continue;
      }
      next.push({ id: uid("file"), name: f.name, size: f.size, type: f.type });
    }
    setAttachments((a) => [...a, ...next].slice(0, 8));
  }

  function addContext(ref: ContextRef) {
    setContext((c) => (c.some((x) => x.kind === ref.kind && x.id === ref.id) ? c : [...c, ref]));
    setPickerOpen(false);
    textareaRef.current?.focus();
  }

  const hero = variant === "hero";

  return (
    <div
      className={cn(
        "relative rounded-xl border bg-panel shadow-composer transition-[border-color,box-shadow] duration-150",
        focused ? "border-line-strong ring-4 ring-accent-soft" : "border-line",
        className,
      )}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        addFiles(e.dataTransfer.files);
      }}
    >
      {(context.length > 0 || attachments.length > 0) && (
        <div className="flex flex-wrap gap-1.5 px-3 pt-3">
          {context.map((c) => (
            <Chip
              key={`${c.kind}:${c.id}`}
              icon={
                c.kind === "integration" ? (
                  <IntegrationLogo id={c.id as IntegrationId} size={14} bare />
                ) : c.kind === "library" ? (
                  <LibraryBig className="size-3.5 text-fg-subtle" />
                ) : (
                  <FolderKanban className="size-3.5 text-fg-subtle" />
                )
              }
              label={c.label}
              onRemove={() => setContext((list) => list.filter((x) => x !== c))}
            />
          ))}
          {attachments.map((a) => (
            <Chip
              key={a.id}
              icon={<FileText className="size-3.5 text-fg-subtle" />}
              label={a.name}
              meta={formatBytes(a.size)}
              onRemove={() => setAttachments((list) => list.filter((x) => x.id !== a.id))}
            />
          ))}
        </div>
      )}

      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverAnchor asChild>
          <div className="px-3.5 pt-3">
            <label htmlFor="composer-input" className="sr-only">
              Message LANA
            </label>
            <textarea
              id="composer-input"
              ref={textareaRef}
              value={speech.interim ? `${text}${text ? " " : ""}${speech.interim}` : text}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={speech.listening ? "Listening…" : placeholder}
              autoFocus={autoFocus}
              rows={1}
              className={cn(
                "block w-full resize-none bg-transparent text-md text-fg placeholder:text-fg-faint focus:outline-none",
                hero ? "min-h-[52px]" : "min-h-6",
              )}
            />
          </div>
        </PopoverAnchor>
        <ContextPicker onPick={addContext} />
      </Popover>

      <div className="flex items-center gap-1 px-2 pb-2 pt-1.5">
        <input ref={fileRef} type="file" multiple hidden onChange={(e) => (addFiles(e.target.files), (e.target.value = ""))} />
        <Tooltip content="Attach files">
          <IconButton label="Attach files" size="sm" onClick={() => fileRef.current?.click()}>
            <Paperclip />
          </IconButton>
        </Tooltip>
        <Tooltip content="Add context" shortcut={["@"]}>
          <IconButton label="Add context" size="sm" onClick={() => setPickerOpen(true)}>
            <AtSign />
          </IconButton>
        </Tooltip>
        <Tooltip content={speech.supported ? (speech.listening ? "Stop listening" : "Voice input") : "Voice input isn't supported in this browser"}>
          <span>
            <IconButton
              label={speech.listening ? "Stop listening" : "Voice input"}
              size="sm"
              onClick={speech.listening ? speech.stop : speech.start}
              disabled={!speech.supported}
              aria-pressed={speech.listening}
              className={cn(speech.listening && "bg-danger-soft text-danger hover:bg-danger-soft hover:text-danger")}
            >
              <Mic />
            </IconButton>
          </span>
        </Tooltip>
        {speech.listening && (
          <span className="ml-1 flex items-center gap-1.5 text-xs text-danger">
            <span className="size-1.5 animate-pulse rounded-full bg-danger" /> Listening
          </span>
        )}

        <span className="ml-auto mr-2 hidden items-center gap-1 text-2xs text-fg-faint lg:flex">
          {busy ? (
            <>
              <Kbd>Esc</Kbd> to stop
            </>
          ) : (
            <>
              <Kbd>Enter</Kbd> to send
            </>
          )}
        </span>
        {busy ? (
          <Tooltip content="Stop" shortcut={["Esc"]}>
            <IconButton label="Stop" variant="secondary" size="md" onClick={onStop} className="ml-auto lg:ml-0">
              <Square className="fill-current" />
            </IconButton>
          </Tooltip>
        ) : (
          <IconButton
            label="Send"
            variant="primary"
            size="md"
            onClick={submit}
            disabled={!canSend}
            className="ml-auto disabled:bg-raised disabled:text-fg-faint disabled:opacity-100 lg:ml-0"
          >
            <ArrowUp />
          </IconButton>
        )}
      </div>
    </div>
  );
});

function Chip({ icon, label, meta, onRemove }: { icon: ReactNode; label: string; meta?: string; onRemove: () => void }) {
  return (
    <span className="animate-fade-in inline-flex h-7 max-w-[240px] items-center gap-1.5 rounded-md border border-line bg-raised pl-2 pr-1 text-xs text-fg">
      {icon}
      <span className="truncate">{label}</span>
      {meta && <span className="shrink-0 text-fg-subtle">{meta}</span>}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="grid size-5 shrink-0 place-items-center rounded text-fg-subtle hover:bg-hover hover:text-fg"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

function ContextPicker({ onPick }: { onPick: (ref: ContextRef) => void }) {
  const connections = useConnections();
  const projects = useProjects();
  const library = useLibrary();
  const connected = connections?.filter((c) => c.status === "connected") ?? [];
  return (
    <PopoverContent align="start" className="w-72 p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
      <Command label="Add context" loop className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:text-fg-subtle">
        <Command.Input
          autoFocus
          placeholder="Add an app or project…"
          className="h-10 w-full border-b border-line-subtle bg-transparent px-3 text-sm placeholder:text-fg-faint focus:outline-none"
        />
        <Command.List className="max-h-72 overflow-y-auto p-1">
          <Command.Empty className="px-3 py-6 text-center text-xs text-fg-subtle">Nothing matches.</Command.Empty>
          <Command.Group heading="Connected apps">
            {connected.map((c) => (
              <PickerItem
                key={c.integrationId}
                value={integrationName(c.integrationId)}
                onSelect={() => onPick({ kind: "integration", id: c.integrationId, label: integrationName(c.integrationId) })}
              >
                <IntegrationLogo id={c.integrationId} size={16} bare />
                {integrationName(c.integrationId)}
              </PickerItem>
            ))}
          </Command.Group>
          <Command.Group heading="Library">
            {library?.map((item) => (
              <PickerItem
                key={item.id}
                value={`${item.name} ${item.aliases.join(" ")}`}
                disabled={item.sharing === "never"}
                onSelect={() => onPick({ kind: "library", id: item.id, label: item.name })}
              >
                <LibraryBig className="size-4 text-fg-subtle" />
                <span className="flex-1 truncate">{item.name}</span>
                {item.sharing === "never" && <span className="text-2xs text-fg-faint">Never shared</span>}
              </PickerItem>
            ))}
          </Command.Group>
          <Command.Group heading="Projects">
            {projects
              ?.filter((p) => p.status !== "completed")
              .map((p) => (
                <PickerItem key={p.id} value={p.name} onSelect={() => onPick({ kind: "project", id: p.id, label: p.name })}>
                  <FolderKanban className="size-4 text-fg-subtle" />
                  {p.name}
                </PickerItem>
              ))}
          </Command.Group>
        </Command.List>
      </Command>
    </PopoverContent>
  );
}

function PickerItem({ children, value, onSelect, disabled }: { children: ReactNode; value: string; onSelect: () => void; disabled?: boolean }) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      disabled={disabled}
      className="flex h-8 cursor-default items-center gap-2.5 rounded-md px-2 text-sm text-fg-muted data-[disabled=true]:opacity-50 data-[selected=true]:bg-hover data-[selected=true]:text-fg"
    >
      {children}
    </Command.Item>
  );
}
