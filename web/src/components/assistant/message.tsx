"use client";

import { useState } from "react";
import { Check, Copy, FileText, FolderKanban, LibraryBig, RotateCcw } from "lucide-react";
import { ApprovalPanel } from "@/components/lana/approval-panel";
import { ExecutionTrace } from "@/components/lana/execution-trace";
import { IntegrationLogo } from "@/components/lana/integration-logo";
import { LanaMark } from "@/components/lana/logo";
import { Markdown } from "@/components/lana/markdown";
import { Button, IconButton } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/feedback";
import { Tooltip } from "@/components/ui/tooltip";
import { approve, decline, isApprovalPending, missingAttachments, retry } from "@/lib/assistant/engine";
import { useLibrary } from "@/lib/data/library";
import type { Message, Phase } from "@/lib/assistant/types";
import { cn } from "@/lib/cn";
import type { IntegrationId } from "@/lib/data/types";
import { formatBytes, formatTime } from "@/lib/format";

export function UserMessage({ message }: { message: Message }) {
  const text = message.parts.find((p) => p.type === "text")?.text;
  return (
    <div className="animate-rise flex flex-col items-end gap-1.5">
      {(message.context || message.attachments) && (
        <div className="flex max-w-[85%] flex-wrap justify-end gap-1.5">
          {message.context?.map((c) => (
            <span key={c.id} className="inline-flex h-6 items-center gap-1.5 rounded-md border border-line px-2 text-xs text-fg-muted">
              {c.kind === "integration" ? (
                <IntegrationLogo id={c.id as IntegrationId} size={12} bare />
              ) : c.kind === "library" ? (
                <LibraryBig className="size-3" />
              ) : (
                <FolderKanban className="size-3" />
              )}
              {c.label}
            </span>
          ))}
          {message.attachments?.map((a) => (
            <span key={a.id} className="inline-flex h-6 items-center gap-1.5 rounded-md border border-line px-2 text-xs text-fg-muted">
              <FileText className="size-3" />
              <span className="max-w-[180px] truncate">{a.name}</span>
              <span className="text-fg-faint">{formatBytes(a.size)}</span>
            </span>
          ))}
        </div>
      )}
      {text && (
        <div className="max-w-[85%] whitespace-pre-wrap rounded-xl rounded-br-md bg-raised px-3.5 py-2 text-md leading-6 text-fg">
          {text}
        </div>
      )}
    </div>
  );
}

const PHASE_LABEL: Partial<Record<Phase, string>> = {
  understanding: "Understanding your request",
  planning: "Planning the steps",
};

export function AssistantMessage({
  message,
  convId,
  phase,
  isLast,
}: {
  message: Message;
  convId: string;
  phase: Phase;
  isLast: boolean;
}) {
  // Re-render when the Library changes, so a removed attachment disables the approval at once.
  const library = useLibrary();
  const lastTextIndex = message.parts.map((p) => p.type).lastIndexOf("text");
  const thinking = message.streaming && isLast && PHASE_LABEL[phase];
  const plainText = message.parts
    .filter((p) => p.type === "text")
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("\n\n");

  return (
    <div className="animate-rise group/msg flex gap-3">
      <LanaMark size={22} className="mt-0.5" />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {message.parts.map((part, i) =>
          part.type === "text" ? (
            part.text && (
              <div key={i} className={cn(message.streaming && i === lastTextIndex && !thinking && "streaming-caret")}>
                <Markdown text={part.text} />
              </div>
            )
          ) : (
            <ExecutionTrace key={part.action.id} action={part.action}>
              {part.action.approval && (
                <ApprovalPanel
                  integrationId={part.action.integrationId}
                  fields={part.action.approval.fields}
                  confirmLabel={part.action.approval.confirmLabel}
                  decision={part.action.approval.decision}
                  decidedAt={part.action.approval.decidedAt}
                  attachments={part.action.approval.attachments}
                  disabled={
                    part.action.status === "awaiting_approval" &&
                    (!isApprovalPending(part.action.id) || (!!library && missingAttachments(part.action).length > 0))
                  }
                  disabledReason={
                    library && missingAttachments(part.action).length > 0 ? "An attachment was removed from your Library." : undefined
                  }
                  onApprove={(fields) => approve(convId, message.id, part.action.id, fields)}
                  onDecline={() => decline(convId, message.id, part.action.id)}
                />
              )}
            </ExecutionTrace>
          ),
        )}

        {thinking && (
          <div className="flex h-6 items-center gap-2" role="status">
            <span className="shimmer-text text-sm">{PHASE_LABEL[phase]}</span>
          </div>
        )}

        {message.error && (
          <ErrorState
            title="Response interrupted"
            description={message.error}
            action={
              isLast && (
                <Button size="sm" icon={<RotateCcw />} onClick={() => retry(convId)}>
                  Retry
                </Button>
              )
            }
          />
        )}

        {!message.streaming && (
          <MessageActions text={plainText} createdAt={message.createdAt} onRetry={isLast && !message.error ? () => retry(convId) : undefined} />
        )}
      </div>
    </div>
  );
}

function MessageActions({ text, createdAt, onRetry }: { text: string; createdAt: string; onRetry?: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="-ml-1.5 -mt-1 flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover/msg:opacity-100 max-md:opacity-100">
      {text && (
        <Tooltip content={copied ? "Copied" : "Copy"}>
          <IconButton
            label="Copy response"
            size="sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              } catch {
                // Clipboard unavailable.
              }
            }}
          >
            {copied ? <Check className="text-success" /> : <Copy />}
          </IconButton>
        </Tooltip>
      )}
      {onRetry && (
        <Tooltip content="Retry">
          <IconButton label="Retry response" size="sm" onClick={onRetry}>
            <RotateCcw />
          </IconButton>
        </Tooltip>
      )}
      <span className="ml-1.5 text-2xs text-fg-faint">{formatTime(createdAt)}</span>
    </div>
  );
}
