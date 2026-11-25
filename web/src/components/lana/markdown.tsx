"use client";

import { memo, useState } from "react";
import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { highlight } from "sugar-high";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";

/** Markdown for assistant replies: GFM tables, highlighted code with copy, internal links via the router. */
export const Markdown = memo(function Markdown({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 text-md text-fg", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {text}
      </ReactMarkdown>
    </div>
  );
});

const COMPONENTS: Components = {
  p: ({ children }) => <p className="leading-[26px]">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-fg">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  h1: ({ children }) => <h3 className="mt-1 text-lg font-semibold">{children}</h3>,
  h2: ({ children }) => <h3 className="mt-1 text-base font-semibold">{children}</h3>,
  h3: ({ children }) => <h4 className="mt-1 text-md font-semibold">{children}</h4>,
  ul: ({ children }) => <ul className="flex flex-col gap-1.5 pl-5 marker:text-fg-faint [list-style-type:disc]">{children}</ul>,
  ol: ({ children }) => <ol className="flex list-decimal flex-col gap-1.5 pl-5 marker:text-fg-subtle">{children}</ol>,
  li: ({ children }) => <li className="pl-1 leading-[24px]">{children}</li>,
  blockquote: ({ children }) => <blockquote className="border-l-2 border-line-strong pl-3 text-fg-muted">{children}</blockquote>,
  hr: () => <hr className="border-line-subtle" />,
  a: ({ href = "", children }) => {
    const cls = "font-medium text-accent-text underline decoration-accent-line underline-offset-[3px] hover:decoration-accent-text";
    if (href.startsWith("/")) {
      return (
        <Link href={href} className={cls}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {children}
      </a>
    );
  },
  code: ({ className, children }) => {
    const lang = /language-(\w+)/.exec(className ?? "")?.[1];
    const raw = String(children ?? "");
    if (lang || raw.includes("\n")) return <CodeBlock code={raw.replace(/\n$/, "")} lang={lang} />;
    return <code className="rounded border border-line-subtle bg-raised px-1 py-px font-mono text-[0.86em]">{children}</code>;
  },
  pre: ({ children }) => <>{children}</>,
  table: ({ children }) => (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-raised text-left">{children}</thead>,
  th: ({ children }) => <th className="whitespace-nowrap border-b border-line px-3 py-2 text-xs font-medium text-fg-muted">{children}</th>,
  td: ({ children }) => <td className="border-b border-line-subtle px-3 py-2 align-top text-fg [tr:last-child_&]:border-0">{children}</td>,
};

const LANG_LABELS: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TSX",
  js: "JavaScript",
  jsx: "JSX",
  bash: "Shell",
  sh: "Shell",
  json: "JSON",
  py: "Python",
  python: "Python",
  sql: "SQL",
};

export function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const highlighted = lang && lang !== "bash" && lang !== "sh" ? highlight(code) : null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked (insecure context); nothing else to do.
    }
  }

  return (
    <div className="group/code overflow-hidden rounded-lg border border-line bg-panel">
      <div className="flex h-8 items-center justify-between border-b border-line-subtle pl-3 pr-1">
        <span className="text-2xs font-medium text-fg-subtle">{lang ? (LANG_LABELS[lang] ?? lang) : "Code"}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy code"}
          className="flex h-6 items-center gap-1.5 rounded px-1.5 text-2xs text-fg-subtle transition-colors hover:bg-hover hover:text-fg"
        >
          {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-3.5 py-3 font-mono text-[12.5px] leading-[20px] text-fg">
        {highlighted ? <code dangerouslySetInnerHTML={{ __html: highlighted }} /> : <code>{code}</code>}
      </pre>
    </div>
  );
}
